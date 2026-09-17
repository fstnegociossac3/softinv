import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";

import {
  auditLogs,
  companies,
  inventoryImportRows,
  inventoryImports,
} from "@/db/schema";

import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/config/audit";

import { IMPORT_LIMITS } from "@/config/imports";

import { PERMISSIONS } from "@/config/permissions";

import type { ColumnMapping } from "@/lib/validations/inventory-import";

import { DomainError } from "@/server/errors/domain.error";

import { parseInventoryFile } from "@/server/imports/inventory-file.parser";

import { normalizeInventoryRow } from "@/server/imports/inventory-normalizer";

import type { AuthContext } from "@/server/services/auth.service";

import {
  requireCompanyAccess,
  requirePermission,
  resolveCompanyId,
} from "@/server/services/authorization.service";

import { getRequestMetadata } from "@/server/utils/request-metadata";

import { chunkArray } from "@/server/utils/chunk";

export async function createInventoryImport(
  auth: AuthContext,
  file: File,
  requestedCompanyId?: string | null,
) {
  requirePermission(auth, PERMISSIONS.IMPORT_CREATE);

  const companyId = resolveCompanyId(auth, requestedCompanyId);

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

  let parsed;

  try {
    parsed = await parseInventoryFile(file);
  } catch (error) {
    throw error;
  }

  const request = await getRequestMetadata();

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

    const rows = parsed.rows.map((rawData, index) => ({
      importId: importRecord.id,

      companyId,

      /*
       * Excel:
       * fila 1 = cabecera
       * primera fila real = 2
       */
      rowNumber: index + 2,

      rawData,

      status: "pending" as const,
    }));

    const batches = chunkArray(rows, IMPORT_LIMITS.INSERT_BATCH_SIZE);

    for (const batch of batches) {
      if (batch.length) {
        await tx.insert(inventoryImportRows).values(batch);
      }
    }

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
    throw new DomainError("IMPORT_NOT_FOUND", "La importación no existe.");
  }

  requireCompanyAccess(auth, importRecord.companyId);

  if (importRecord.status === "processed") {
    throw new DomainError(
      "IMPORT_ALREADY_PROCESSED",
      "La importación ya fue procesada.",
    );
  }

  const mappedHeaders = Object.values(mapping).filter(Boolean);

  for (const header of mappedHeaders) {
    if (!importRecord.headers.includes(header)) {
      throw new DomainError(
        "IMPORT_MAPPING_INVALID",
        `La columna "${header}" no existe en el archivo.`,
      );
    }
  }

  const rawRows = await db
    .select()
    .from(inventoryImportRows)
    .where(eq(inventoryImportRows.importId, importId))
    .orderBy(inventoryImportRows.rowNumber);

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
      const skuKey = result.data.sku.trim().toUpperCase();

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

  await db.transaction(async (tx) => {
    await tx
      .update(inventoryImports)
      .set({
        status: "validating",

        updatedAt: new Date(),
      })
      .where(eq(inventoryImports.id, importId));

    /*
     * Reemplazamos las filas staging
     * por su versión validada.
     */
    await tx
      .delete(inventoryImportRows)
      .where(eq(inventoryImportRows.importId, importId));

    const batches = chunkArray(processedRows, IMPORT_LIMITS.INSERT_BATCH_SIZE);

    for (const batch of batches) {
      if (batch.length) {
        await tx.insert(inventoryImportRows).values(batch);
      }
    }

    const finalStatus = validRows > 0 ? "ready" : "failed";

    await tx
      .update(inventoryImports)
      .set({
        status: finalStatus,

        columnMapping: mapping,

        validRows,

        invalidRows,

        duplicateRows,

        errorSummary,

        updatedAt: new Date(),

        completedAt: new Date(),
      })
      .where(eq(inventoryImports.id, importId));

    await tx.insert(auditLogs).values({
      companyId: importRecord.companyId,

      userId: auth.userId,

      module: AUDIT_MODULES.IMPORTS,

      action: AUDIT_ACTIONS.PROCESS,

      entityType: "inventory_import",

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

    status: validRows > 0 ? "ready" : "failed",

    errorSummary,
  };
}
