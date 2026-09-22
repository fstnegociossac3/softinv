import "server-only";

import { and, asc, desc, eq, gte, lt } from "drizzle-orm";

import { IRI_ANALYSIS } from "@/config/iri";

import { PERMISSIONS } from "@/config/permissions";

import { db } from "@/db";

import {
  companies,
  inventoryItems,
  inventoryItemSnapshots,
  inventoryMovements,
} from "@/db/schema";

import { calculateIriDashboard } from "@/lib/iri/calculate-iri";

import type { IriDashboardResult, IriInventoryInput } from "@/lib/iri/types";

import { DomainError } from "@/server/errors/domain.error";

import { requireAuth } from "@/server/services/auth.service";

import {
  requirePermission,
  resolveCompanyId,
} from "@/server/services/authorization.service";

const DAY_MS = 24 * 60 * 60 * 1000;

/*
|--------------------------------------------------------------------------
| FILTROS
|--------------------------------------------------------------------------
*/

export type IriFilters = {
  /*
   * Usuario:
   * se ignora y se usa auth.company.id.
   *
   * Admin:
   * obligatorio.
   */
  companyId?: string;

  /*
   * YYYY-MM-DD
   */
  from?: string;

  /*
   * YYYY-MM-DD
   */
  to?: string;

  opportunityLimit?: number;
};

export type ResolvedIriFilters = {
  companyId: string;

  companyName: string;

  from: string;

  to: string;

  fromDate: Date;

  toDate: Date;

  toExclusive: Date;

  periodDays: number;

  opportunityLimit: number;
};

/*
|--------------------------------------------------------------------------
| FECHAS
|--------------------------------------------------------------------------
*/

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateOnly(
  value: string,

  field: "from" | "to",
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new DomainError(
      "IRI_DATE_INVALID",

      `La fecha ${field === "from" ? "Desde" : "Hasta"} no es válida.`,
    );
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || formatDateOnly(date) !== value) {
    throw new DomainError(
      "IRI_DATE_INVALID",

      `La fecha ${field === "from" ? "Desde" : "Hasta"} no es válida.`,
    );
  }

  return date;
}

/*
|--------------------------------------------------------------------------
| RESOLVER FILTROS
|--------------------------------------------------------------------------
*/

async function resolveIriFilters(
  filters: IriFilters,
): Promise<ResolvedIriFilters> {
  const auth = await requireAuth();

  requirePermission(
    auth,

    PERMISSIONS.IRI_VIEW,
  );

  /*
   * Esta función ya existe
   * en tu proyecto.
   *
   * USER:
   * auth.company.id
   *
   * ADMIN:
   * companyId solicitado
   */
  const companyId = resolveCompanyId(
    auth,

    filters.companyId,
  );

  /*
   * Verificamos empresa.
   */
  const [company] = await db
    .select({
      id: companies.id,

      name: companies.name,

      status: companies.status,
    })
    .from(companies)
    .where(
      eq(
        companies.id,

        companyId,
      ),
    )
    .limit(1);

  if (!company || company.status !== "active") {
    throw new DomainError(
      "IRI_COMPANY_INVALID",

      "La empresa seleccionada no existe o está inactiva.",
    );
  }

  /*
   * Hoy sin horas.
   */
  const today = new Date();

  const defaultToDate = new Date(
    Date.UTC(
      today.getUTCFullYear(),

      today.getUTCMonth(),

      today.getUTCDate(),
    ),
  );

  /*
   * Fecha Hasta.
   */
  const toDate = filters.to
    ? parseDateOnly(
        filters.to,

        "to",
      )
    : defaultToDate;

  /*
   * Por defecto:
   * últimos 90 días.
   */
  const defaultFromDate = new Date(
    toDate.getTime() - (IRI_ANALYSIS.DEFAULT_DAYS - 1) * DAY_MS,
  );

  const fromDate = filters.from
    ? parseDateOnly(
        filters.from,

        "from",
      )
    : defaultFromDate;

  /*
   * Validar orden.
   */
  if (fromDate.getTime() > toDate.getTime()) {
    throw new DomainError(
      "IRI_DATE_RANGE_INVALID",

      "La fecha Desde no puede ser posterior a la fecha Hasta.",
    );
  }

  /*
   * Incluimos ambos extremos.
   */
  const periodDays =
    Math.floor((toDate.getTime() - fromDate.getTime()) / DAY_MS) + 1;

  /*
   * Actualmente disponemos
   * de hasta 180 días de ventas.
   */
  if (
    periodDays < IRI_ANALYSIS.MIN_DAYS ||
    periodDays > IRI_ANALYSIS.MAX_DAYS
  ) {
    throw new DomainError(
      "IRI_DATE_RANGE_INVALID",

      `El periodo de análisis debe estar entre ${IRI_ANALYSIS.MIN_DAYS} y ${IRI_ANALYSIS.MAX_DAYS} días.`,
    );
  }

  /*
   * Para incluir todo el día
   * seleccionado en "Hasta".
   */
  const toExclusive = new Date(toDate.getTime() + DAY_MS);

  const opportunityLimit = Math.min(
    Math.max(
      Math.round(
        filters.opportunityLimit ?? IRI_ANALYSIS.DEFAULT_OPPORTUNITY_LIMIT,
      ),

      1,
    ),

    IRI_ANALYSIS.MAX_OPPORTUNITY_LIMIT,
  );

  return {
    companyId,

    companyName: company.name,

    from: formatDateOnly(fromDate),

    to: formatDateOnly(toDate),

    fromDate,

    toDate,

    toExclusive,

    periodDays,

    opportunityLimit,
  };
}

/*
|--------------------------------------------------------------------------
| DATASET IRI
|--------------------------------------------------------------------------
|
| Tomamos el último snapshot disponible
| de cada SKU hasta la fecha "Hasta".
|
| Esto nos permite reconstruir históricamente
| el inventario.
|
*/

async function loadLatestIriDataset(
  filters: ResolvedIriFilters,
): Promise<IriInventoryInput[]> {
  const rows = await db
    .selectDistinctOn(
      [inventoryItemSnapshots.inventoryItemId],

      {
        id: inventoryItems.id,

        companyId: inventoryItems.companyId,

        sku: inventoryItems.sku,

        description: inventoryItems.description,

        category: inventoryItems.category,

        brand: inventoryItems.brand,

        location: inventoryItems.location,

        /*
         * IMPORTANTE:
         *
         * utilizamos los datos
         * históricos del snapshot,
         * no el stock actual.
         */
        stockQuantity: inventoryItemSnapshots.stockQuantity,

        unitCost: inventoryItemSnapshots.unitCost,

        lastMovementDate: inventoryItemSnapshots.lastMovementDate,

        sales30d: inventoryItemSnapshots.sales30d,

        sales90d: inventoryItemSnapshots.sales90d,

        sales180d: inventoryItemSnapshots.sales180d,

        capturedAt: inventoryItemSnapshots.capturedAt,
      },
    )
    .from(inventoryItemSnapshots)
    .innerJoin(
      inventoryItems,

      eq(
        inventoryItems.id,

        inventoryItemSnapshots.inventoryItemId,
      ),
    )
    .where(
      and(
        eq(
          inventoryItemSnapshots.companyId,

          filters.companyId,
        ),

        eq(
          inventoryItems.companyId,

          filters.companyId,
        ),

        eq(
          inventoryItems.status,

          "active",
        ),

        /*
         * Último estado conocido
         * hasta la fecha Hasta.
         */
        lt(
          inventoryItemSnapshots.capturedAt,

          filters.toExclusive,
        ),
      ),
    )
    .orderBy(
      inventoryItemSnapshots.inventoryItemId,

      desc(inventoryItemSnapshots.capturedAt),
    );

  return rows;
}

/*
|--------------------------------------------------------------------------
| DASHBOARD IRI
|--------------------------------------------------------------------------
|
| Backend para:
|
| - IRI promedio
| - alta recuperabilidad
| - oportunidades
| - distribución
| - variables
|
*/

export async function getIriDashboard(filters: IriFilters = {}): Promise<{
  filters: Pick<
    ResolvedIriFilters,
    "companyId" | "companyName" | "from" | "to" | "periodDays"
  >;

  dashboard: IriDashboardResult;
}> {
  const resolvedFilters = await resolveIriFilters(filters);

  const dataset = await loadLatestIriDataset(resolvedFilters);

  const dashboard = calculateIriDashboard(
    dataset,

    {
      referenceDate: resolvedFilters.toDate,

      periodDays: resolvedFilters.periodDays,

      opportunityLimit: resolvedFilters.opportunityLimit,
    },
  );

  return {
    filters: {
      companyId: resolvedFilters.companyId,

      companyName: resolvedFilters.companyName,

      from: resolvedFilters.from,

      to: resolvedFilters.to,

      periodDays: resolvedFilters.periodDays,
    },

    dashboard,
  };
}

/*
|--------------------------------------------------------------------------
| SKU DISPONIBLES
|--------------------------------------------------------------------------
|
| Luego será utilizado
| por el selector del frontend.
|
*/

export async function getIriSkuOptions(filters: IriFilters = {}) {
  const resolvedFilters = await resolveIriFilters(filters);

  const dataset = await loadLatestIriDataset(resolvedFilters);

  return dataset
    .map((item) => ({
      id: item.id,

      sku: item.sku,

      description: item.description,

      category: item.category,

      brand: item.brand,

      stockQuantity: item.stockQuantity,
    }))
    .sort((a, b) =>
      a.sku.localeCompare(
        b.sku,

        "es",
      ),
    );
}

/*
|--------------------------------------------------------------------------
| ANÁLISIS SKU
|--------------------------------------------------------------------------
*/

export async function getIriSkuAnalysis(
  itemId: string,

  filters: IriFilters = {},
) {
  const resolvedFilters = await resolveIriFilters(filters);

  /*
   * Necesitamos el inventario completo
   * porque la Demanda se normaliza
   * respecto a los otros SKU.
   */
  const dataset = await loadLatestIriDataset(resolvedFilters);

  const dashboard = calculateIriDashboard(
    dataset,

    {
      referenceDate: resolvedFilters.toDate,

      periodDays: resolvedFilters.periodDays,

      opportunityLimit: resolvedFilters.opportunityLimit,
    },
  );

  /*
   * Esto también protege contra
   * intentar consultar un SKU
   * perteneciente a otra empresa.
   */
  const item = dashboard.items.find((candidate) => candidate.id === itemId);

  if (!item) {
    return null;
  }

  /*
   * Histórico del SKU.
   */
  const [snapshots, movements] = await Promise.all([
    /*
     * SNAPSHOTS
     */
    db
      .select({
        id: inventoryItemSnapshots.id,

        stockQuantity: inventoryItemSnapshots.stockQuantity,

        unitCost: inventoryItemSnapshots.unitCost,

        lastMovementDate: inventoryItemSnapshots.lastMovementDate,

        sales30d: inventoryItemSnapshots.sales30d,

        sales90d: inventoryItemSnapshots.sales90d,

        sales180d: inventoryItemSnapshots.sales180d,

        capturedAt: inventoryItemSnapshots.capturedAt,
      })
      .from(inventoryItemSnapshots)
      .where(
        and(
          eq(
            inventoryItemSnapshots.companyId,

            resolvedFilters.companyId,
          ),

          eq(
            inventoryItemSnapshots.inventoryItemId,

            itemId,
          ),

          gte(
            inventoryItemSnapshots.capturedAt,

            resolvedFilters.fromDate,
          ),

          lt(
            inventoryItemSnapshots.capturedAt,

            resolvedFilters.toExclusive,
          ),
        ),
      )
      .orderBy(asc(inventoryItemSnapshots.capturedAt)),

    /*
     * MOVIMIENTOS
     */
    db
      .select({
        id: inventoryMovements.id,

        movementType: inventoryMovements.movementType,

        quantity: inventoryMovements.quantity,

        movementDate: inventoryMovements.movementDate,

        createdAt: inventoryMovements.createdAt,
      })
      .from(inventoryMovements)
      .where(
        and(
          eq(
            inventoryMovements.companyId,

            resolvedFilters.companyId,
          ),

          eq(
            inventoryMovements.inventoryItemId,

            itemId,
          ),

          gte(
            inventoryMovements.movementDate,

            resolvedFilters.fromDate,
          ),

          lt(
            inventoryMovements.movementDate,

            resolvedFilters.toExclusive,
          ),
        ),
      )
      .orderBy(desc(inventoryMovements.movementDate)),
  ]);

  return {
    filters: {
      companyId: resolvedFilters.companyId,

      companyName: resolvedFilters.companyName,

      from: resolvedFilters.from,

      to: resolvedFilters.to,

      periodDays: resolvedFilters.periodDays,
    },

    /*
     * IRI completo del SKU.
     */
    item,

    /*
     * Histórico.
     */
    history: {
      snapshots: snapshots.map((snapshot) => ({
        ...snapshot,

        stockValue:
          Math.round(
            (snapshot.stockQuantity * snapshot.unitCost + Number.EPSILON) * 100,
          ) / 100,
      })),

      movements,
    },
  };
}
