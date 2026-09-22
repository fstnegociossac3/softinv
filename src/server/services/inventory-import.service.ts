import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";

import {
  auditLogs,
  companies,
  inventoryImportRows,
  inventoryImports,
  inventoryItems,
  inventoryItemSnapshots,
  inventoryMovements,
} from "@/db/schema";

import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/config/audit";

import { IMPORT_LIMITS } from "@/config/imports";

import { PERMISSIONS } from "@/config/permissions";

import { normalizeSku } from "@/lib/inventory/normalize-sku";

import type { ColumnMapping } from "@/lib/validations/inventory-import";

import { DomainError } from "@/server/errors/domain.error";

import { parseInventoryFile } from "@/server/imports/inventory-file.parser";

import {
  normalizeInventoryRow,
  type NormalizedInventoryRow,
} from "@/server/imports/inventory-normalizer";

import type { AuthContext } from "@/server/services/auth.service";

import {
  requireCompanyAccess,
  requirePermission,
  resolveCompanyId,
} from "@/server/services/authorization.service";

import { chunkArray } from "@/server/utils/chunk";

import { getRequestMetadata } from "@/server/utils/request-metadata";

/*
|--------------------------------------------------------------------------
| UTILIDADES
|--------------------------------------------------------------------------
*/

function roundFour(value: number) {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000;
}

/*
|--------------------------------------------------------------------------
| CREAR IMPORTACIÓN
|--------------------------------------------------------------------------
*/

export async function createInventoryImport(
  auth: AuthContext,

  file: File,

  requestedCompanyId?: string | null,
) {
  requirePermission(auth, PERMISSIONS.IMPORT_CREATE);

  const companyId = resolveCompanyId(auth, requestedCompanyId);

  /*
   * Validar empresa.
   */
  const [company] = await db
    .select({
      id: companies.id,

      status: companies.status,
    })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (!company || company.status !== "active") {
    throw new DomainError(
      "IMPORT_COMPANY_INVALID",

      "La empresa seleccionada no existe o está inactiva.",
    );
  }

  /*
   * Leer Excel / CSV.
   */
  const parsed = await parseInventoryFile(file);

  const request = await getRequestMetadata();

  /*
   * Guardar staging.
   */
  const result = await db.transaction(async (tx) => {
    const [importRecord] = await tx
      .insert(inventoryImports)
      .values({
        companyId,

        createdBy: auth.userId,

        originalFileName: parsed.originalFileName,

        sourceType: parsed.sourceType,

        sheetName: parsed.sheetName,

        status: "uploaded",

        totalRows: parsed.rows.length,

        headers: parsed.headers,
      })
      .returning();

    /*
     * Fila 1 = encabezados.
     *
     * Por ello la primera
     * fila real comienza en 2.
     */
    const rows = parsed.rows.map((rawData, index) => ({
      importId: importRecord.id,

      companyId,

      rowNumber: index + 2,

      rawData,

      status: "pending" as const,
    }));

    /*
     * Insertamos por lotes.
     */
    const batches = chunkArray(
      rows,

      IMPORT_LIMITS.INSERT_BATCH_SIZE,
    );

    for (const batch of batches) {
      if (batch.length) {
        await tx.insert(inventoryImportRows).values(batch);
      }
    }

    /*
     * Auditoría.
     */
    await tx.insert(auditLogs).values({
      companyId,

      userId: auth.userId,

      module: AUDIT_MODULES.IMPORTS,

      action: AUDIT_ACTIONS.IMPORT,

      entityType: "inventory_import",

      entityId: importRecord.id,

      metadata: {
        fileName: parsed.originalFileName,

        sourceType: parsed.sourceType,

        totalRows: parsed.rows.length,

        headers: parsed.headers,
      },

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    });

    return importRecord;
  });

  return {
    importId: result.id,

    status: result.status,

    totalRows: result.totalRows,

    headers: parsed.headers,

    preview: parsed.preview,
  };
}

/*
|--------------------------------------------------------------------------
| VALIDAR Y NORMALIZAR MAPPING
|--------------------------------------------------------------------------
*/

export async function processInventoryImportMapping(
  auth: AuthContext,

  importId: string,

  mapping: ColumnMapping,
) {
  requirePermission(auth, PERMISSIONS.IMPORT_PROCESS);

  const [importRecord] = await db
    .select()
    .from(inventoryImports)
    .where(eq(inventoryImports.id, importId))
    .limit(1);

  if (!importRecord) {
    throw new DomainError(
      "IMPORT_NOT_FOUND",

      "La importación no existe.",
    );
  }

  requireCompanyAccess(auth, importRecord.companyId);

  if (importRecord.status === "processed") {
    throw new DomainError(
      "IMPORT_ALREADY_PROCESSED",

      "La importación ya fue procesada.",
    );
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDAR COLUMNAS
  |--------------------------------------------------------------------------
  */

  const mappedHeaders = Object.values(mapping).filter(
    (value): value is string => Boolean(value),
  );

  for (const header of mappedHeaders) {
    if (!importRecord.headers.includes(header)) {
      throw new DomainError(
        "IMPORT_MAPPING_INVALID",

        `La columna "${header}" no existe en el archivo.`,
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | OBTENER FILAS
  |--------------------------------------------------------------------------
  */

  const rawRows = await db
    .select()
    .from(inventoryImportRows)
    .where(eq(inventoryImportRows.importId, importId))
    .orderBy(inventoryImportRows.rowNumber);

  /*
  |--------------------------------------------------------------------------
  | VALIDAR FILAS
  |--------------------------------------------------------------------------
  */

  const seenSkus = new Set<string>();

  let validRows = 0;

  let invalidRows = 0;

  let duplicateRows = 0;

  const errorSummary: Record<string, number> = {};

  const processedRows = rawRows.map((row) => {
    const result = normalizeInventoryRow(row.rawData, mapping);

    let status: "valid" | "invalid" | "duplicate";

    const errors = [...result.errors];

    if (!result.data) {
      status = "invalid";

      invalidRows++;
    } else {
      const skuKey = normalizeSku(result.data.sku);

      /*
       * Evitar que un mismo
       * SKU aparezca dos veces
       * en el mismo archivo.
       */
      if (seenSkus.has(skuKey)) {
        status = "duplicate";

        duplicateRows++;

        errors.push({
          field: "sku",

          code: "DUPLICATE_SKU",

          message: "El SKU está duplicado dentro del archivo.",
        });
      } else {
        seenSkus.add(skuKey);

        status = "valid";

        validRows++;
      }
    }

    for (const error of errors) {
      errorSummary[error.code] = (errorSummary[error.code] ?? 0) + 1;
    }

    return {
      importId,

      companyId: importRecord.companyId,

      rowNumber: row.rowNumber,

      rawData: row.rawData,

      normalizedData: result.data,

      status,

      errors: errors.length ? errors : null,

      fingerprint: result.fingerprint,
    };
  });

  const request = await getRequestMetadata();

  const now = new Date();

  const finalStatus = validRows > 0 ? "ready" : "failed";

  /*
  |--------------------------------------------------------------------------
  | GUARDAR VALIDACIÓN
  |--------------------------------------------------------------------------
  */

  await db.transaction(async (tx) => {
    await tx
      .update(inventoryImports)
      .set({
        status: "validating",

        updatedAt: now,
      })
      .where(eq(inventoryImports.id, importId));

    /*
     * Reemplazamos staging
     * original por staging
     * normalizado.
     */
    await tx
      .delete(inventoryImportRows)
      .where(eq(inventoryImportRows.importId, importId));

    const batches = chunkArray(
      processedRows,

      IMPORT_LIMITS.INSERT_BATCH_SIZE,
    );

    for (const batch of batches) {
      if (batch.length) {
        await tx.insert(inventoryImportRows).values(batch);
      }
    }

    /*
     * READY significa que
     * ya puede pasar a
     * inventory_items.
     */
    await tx
      .update(inventoryImports)
      .set({
        status: finalStatus,

        columnMapping: mapping,

        validRows,

        invalidRows,

        duplicateRows,

        errorSummary,

        updatedAt: now,

        completedAt: finalStatus === "failed" ? now : null,
      })
      .where(eq(inventoryImports.id, importId));

    /*
     * Auditoría de validación.
     */
    await tx.insert(auditLogs).values({
      companyId: importRecord.companyId,

      userId: auth.userId,

      module: AUDIT_MODULES.IMPORTS,

      action: AUDIT_ACTIONS.PROCESS,

      entityType: "inventory_import_validation",

      entityId: importId,

      metadata: {
        totalRows: rawRows.length,

        validRows,

        invalidRows,

        duplicateRows,

        errorSummary,
      },

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    });
  });

  return {
    importId,

    totalRows: rawRows.length,

    validRows,

    invalidRows,

    duplicateRows,

    status: finalStatus,

    errorSummary,
  };
}

/*
|--------------------------------------------------------------------------
| CONSOLIDAR IMPORTACIÓN EN INVENTARIO
|--------------------------------------------------------------------------
*/

export async function processReadyInventoryImport(
  auth: AuthContext,

  importId: string,
) {
  requirePermission(auth, PERMISSIONS.IMPORT_PROCESS);

  const request = await getRequestMetadata();

  return db.transaction(async (tx) => {
    /*
      |--------------------------------------------------------------------------
      | IMPORTACIÓN
      |--------------------------------------------------------------------------
      */

    const [importRecord] = await tx
      .select()
      .from(inventoryImports)
      .where(eq(inventoryImports.id, importId))
      .limit(1);

    if (!importRecord) {
      throw new DomainError(
        "IMPORT_NOT_FOUND",

        "La importación no existe.",
      );
    }

    requireCompanyAccess(auth, importRecord.companyId);

    if (importRecord.status === "processed") {
      throw new DomainError(
        "IMPORT_ALREADY_PROCESSED",

        "La importación ya fue procesada.",
      );
    }

    if (importRecord.status !== "ready") {
      throw new DomainError(
        "IMPORT_NOT_READY",

        "La importación todavía no está lista para procesarse.",
      );
    }

    const processedAt = new Date();

    /*
      |--------------------------------------------------------------------------
      | BLOQUEAR DOBLE PROCESAMIENTO
      |--------------------------------------------------------------------------
      |
      | Solamente una ejecución puede
      | cambiar READY -> VALIDATING.
      |
      */

    const [claimedImport] = await tx
      .update(inventoryImports)
      .set({
        status: "validating",

        updatedAt: processedAt,
      })
      .where(
        and(
          eq(inventoryImports.id, importId),

          eq(inventoryImports.status, "ready"),
        ),
      )
      .returning({
        id: inventoryImports.id,
      });

    if (!claimedImport) {
      throw new DomainError(
        "IMPORT_PROCESSING_CONFLICT",

        "La importación ya está siendo procesada o cambió de estado.",
      );
    }

    /*
      |--------------------------------------------------------------------------
      | FILAS VÁLIDAS
      |--------------------------------------------------------------------------
      */

    const validRows = await tx
      .select()
      .from(inventoryImportRows)
      .where(
        and(
          eq(inventoryImportRows.importId, importId),

          eq(inventoryImportRows.status, "valid"),
        ),
      )
      .orderBy(inventoryImportRows.rowNumber);

    if (!validRows.length) {
      throw new DomainError(
        "IMPORT_NO_VALID_ROWS",

        "La importación no contiene filas válidas.",
      );
    }

    /*
      |--------------------------------------------------------------------------
      | NORMALIZAR DATOS
      |--------------------------------------------------------------------------
      */

    const rowsToProcess = validRows.map((row) => {
      const data = row.normalizedData as NormalizedInventoryRow | null;

      if (!data) {
        throw new DomainError(
          "IMPORT_NORMALIZED_DATA_MISSING",

          `La fila ${row.rowNumber} no contiene datos normalizados.`,
        );
      }

      return {
        row,

        data,

        skuNormalized: normalizeSku(data.sku),
      };
    });

    /*
      |--------------------------------------------------------------------------
      | CARGAR SKU EXISTENTES
      |--------------------------------------------------------------------------
      |
      | Evitamos hacer un SELECT individual
      | por cada fila del Excel.
      |
      */

    const existingItemsBySku = new Map<
      string,
      typeof inventoryItems.$inferSelect
    >();

    const skuList = [
      ...new Set(rowsToProcess.map((item) => item.skuNormalized)),
    ];

    /*
     * PostgreSQL no debería recibir
     * 50,000 SKU en un único IN.
     */
    for (const skuBatch of chunkArray(skuList, 500)) {
      if (!skuBatch.length) {
        continue;
      }

      const existingItems = await tx
        .select()
        .from(inventoryItems)
        .where(
          and(
            eq(inventoryItems.companyId, importRecord.companyId),

            inArray(inventoryItems.skuNormalized, skuBatch),
          ),
        );

      for (const item of existingItems) {
        existingItemsBySku.set(item.skuNormalized, item);
      }
    }

    /*
      |--------------------------------------------------------------------------
      | CONTADORES
      |--------------------------------------------------------------------------
      */

    let createdItems = 0;

    let updatedItems = 0;

    let createdMovements = 0;

    /*
      |--------------------------------------------------------------------------
      | PROCESAR SKU
      |--------------------------------------------------------------------------
      */

    for (const { row, data, skuNormalized } of rowsToProcess) {
      const existingItem = existingItemsBySku.get(skuNormalized);

      const previousStock = existingItem?.stockQuantity ?? 0;

      /*
       * Diferencia contra
       * inventario anterior.
       */
      const stockDifference = roundFour(data.stockQuantity - previousStock);

      /*
       * Valor del inventario.
       *
       * Aunque PostgreSQL ya tiene
       * trigger, también lo calculamos
       * desde backend.
       */
      const stockValue = roundFour(data.stockQuantity * data.unitCost);

      /*
       * Fecha del movimiento.
       */
      const sourceMovementDate = data.lastMovementDate
        ? new Date(data.lastMovementDate)
        : null;

      const stockChanged = !existingItem
        ? data.stockQuantity > 0
        : stockDifference !== 0;

      /*
       * Si Excel trae fecha,
       * usamos esa fecha.
       *
       * Si no, pero cambió stock,
       * usamos fecha de importación.
       *
       * Si no cambió, conservamos
       * la fecha anterior.
       */
      const effectiveLastMovementDate = sourceMovementDate
        ? sourceMovementDate
        : stockChanged
          ? processedAt
          : (existingItem?.lastMovementDate ?? null);

      let inventoryItem: typeof inventoryItems.$inferSelect | undefined;

      /*
        |--------------------------------------------------------------------------
        | ACTUALIZAR SKU EXISTENTE
        |--------------------------------------------------------------------------
        */

      if (existingItem) {
        const [updatedItem] = await tx
          .update(inventoryItems)
          .set({
            sku: data.sku,

            skuNormalized,

            description: data.description,

            category: data.category,

            brand: data.brand,

            stockQuantity: data.stockQuantity,

            unitCost: data.unitCost,

            stockValue,

            lastMovementDate: effectiveLastMovementDate,

            location: data.location,

            sales30d: data.sales30d ?? 0,

            sales90d: data.sales90d ?? 0,

            sales180d: data.sales180d ?? 0,

            lastImportId: importId,

            lastImportedAt: processedAt,

            status: "active",

            updatedAt: processedAt,
          })
          .where(eq(inventoryItems.id, existingItem.id))
          .returning();

        inventoryItem = updatedItem;

        updatedItems++;
      } else {
        /*
          |--------------------------------------------------------------------------
          | CREAR SKU NUEVO
          |--------------------------------------------------------------------------
          */

        const [createdItem] = await tx
          .insert(inventoryItems)
          .values({
            companyId: importRecord.companyId,

            sku: data.sku,

            skuNormalized,

            description: data.description,

            category: data.category,

            brand: data.brand,

            stockQuantity: data.stockQuantity,

            unitCost: data.unitCost,

            stockValue,

            lastMovementDate: effectiveLastMovementDate,

            location: data.location,

            sales30d: data.sales30d ?? 0,

            sales90d: data.sales90d ?? 0,

            sales180d: data.sales180d ?? 0,

            lastImportId: importId,

            lastImportedAt: processedAt,

            status: "active",
          })
          .returning();

        inventoryItem = createdItem;

        createdItems++;
      }

      if (!inventoryItem) {
        throw new DomainError(
          "INVENTORY_ITEM_PROCESS_FAILED",

          `No se pudo procesar el SKU ${data.sku}.`,
        );
      }

      /*
       * Actualizamos mapa local.
       */
      existingItemsBySku.set(skuNormalized, inventoryItem);

      /*
        |--------------------------------------------------------------------------
        | SNAPSHOT
        |--------------------------------------------------------------------------
        |
        | Guarda el estado exacto
        | del SKU en esta importación.
        |
        */

      await tx
        .insert(inventoryItemSnapshots)
        .values({
          companyId: importRecord.companyId,

          inventoryItemId: inventoryItem.id,

          importId,

          importRowId: row.id,

          stockQuantity: data.stockQuantity,

          unitCost: data.unitCost,

          lastMovementDate: effectiveLastMovementDate,

          sales30d: data.sales30d ?? 0,

          sales90d: data.sales90d ?? 0,

          sales180d: data.sales180d ?? 0,

          capturedAt: processedAt,
        })
        .onConflictDoNothing();

      /*
        |--------------------------------------------------------------------------
        | MOVIMIENTO - PRODUCTO NUEVO
        |--------------------------------------------------------------------------
        |
        | Ejemplo:
        |
        | nuevo SKU
        | stock = 50
        |
        | movement_type = import
        | quantity = 50
        |
        */

      if (!existingItem && data.stockQuantity > 0) {
        await tx.insert(inventoryMovements).values({
          companyId: importRecord.companyId,

          inventoryItemId: inventoryItem.id,

          movementType: "import",

          quantity: roundFour(data.stockQuantity),

          movementDate: sourceMovementDate ?? processedAt,
        });

        createdMovements++;
      } else if (existingItem && stockDifference !== 0) {

      /*
        |--------------------------------------------------------------------------
        | MOVIMIENTO - SKU EXISTENTE
        |--------------------------------------------------------------------------
        */
        /*
         * 10 -> 15
         *
         * entrada 5
         *
         *
         * 15 -> 8
         *
         * salida 7
         */
        const movementType = stockDifference > 0 ? "entry" : "exit";

        const quantity = Math.abs(stockDifference);

        await tx.insert(inventoryMovements).values({
          companyId: importRecord.companyId,

          inventoryItemId: inventoryItem.id,

          movementType,

          quantity,

          movementDate: sourceMovementDate ?? processedAt,
        });

        createdMovements++;
      }
    }

    /*
      |--------------------------------------------------------------------------
      | FINALIZAR IMPORTACIÓN
      |--------------------------------------------------------------------------
      */

    await tx
      .update(inventoryImports)
      .set({
        status: "processed",

        updatedAt: processedAt,

        completedAt: processedAt,
      })
      .where(eq(inventoryImports.id, importId));

    /*
      |--------------------------------------------------------------------------
      | AUDITORÍA
      |--------------------------------------------------------------------------
      */

    await tx.insert(auditLogs).values({
      companyId: importRecord.companyId,

      userId: auth.userId,

      module: AUDIT_MODULES.INVENTORY,

      action: AUDIT_ACTIONS.PROCESS,

      entityType: "inventory_import",

      entityId: importId,

      metadata: {
        importId,

        validRows: validRows.length,

        createdItems,

        updatedItems,

        createdMovements,
      },

      requestId: request.requestId,

      ipAddress: request.ipAddress,

      userAgent: request.userAgent,
    });

    return {
      importId,

      status: "processed" as const,

      processedRows: validRows.length,

      createdItems,

      updatedItems,

      createdMovements,
    };
  });
}

/*
|--------------------------------------------------------------------------
| VALIDAR + PROCESAR AUTOMÁTICAMENTE
|--------------------------------------------------------------------------
*/

export async function validateAndProcessInventoryImport(
  auth: AuthContext,

  importId: string,

  mapping: ColumnMapping,
) {
  /*
   * 1. Validar.
   */
  const validation = await processInventoryImportMapping(
    auth,
    importId,
    mapping,
  );

  /*
   * Si no existe ninguna fila
   * válida, no consolidamos.
   */
  if (validation.status !== "ready") {
    return {
      validation,

      inventory: null,
    };
  }

  /*
   * 2. Consolidar automáticamente.
   */
  const inventory = await processReadyInventoryImport(auth, importId);

  return {
    validation,

    inventory,
  };
}
