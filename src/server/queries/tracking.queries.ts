import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lt,
  lte,
  or,
  type SQL,
} from "drizzle-orm";

import { PERMISSIONS } from "@/config/permissions";

import { TRACKING_LIMITS, type TrackingDisplayStatus } from "@/config/tracking";

import { db } from "@/db";

import {
  companies,
  inventoryItems,
  profiles,
  trackingActions,
  trackingActivities,
} from "@/db/schema";

import {
  differenceInDateOnlyDays,
  getTodayInTimeZone,
  isValidDateOnly,
} from "@/lib/tracking/date";

import { DomainError } from "@/server/errors/domain.error";

import { requireAuth } from "@/server/services/auth.service";

import {
  requireCompanyAccess,
  requirePermission,
  resolveCompanyId,
} from "@/server/services/authorization.service";

/*
|--------------------------------------------------------------------------
| FILTROS
|--------------------------------------------------------------------------
*/

export type TrackingFilters = {
  companyId?: string;

  /*
   * El filtro principal de fecha
   * se aplica a due_date.
   */
  from?: string;

  to?: string;

  status?: TrackingDisplayStatus;

  search?: string;

  page?: number;
};

/*
|--------------------------------------------------------------------------
| CONTEXTO
|--------------------------------------------------------------------------
*/

async function resolveTrackingContext(filters: TrackingFilters) {
  const auth = await requireAuth();

  requirePermission(auth, PERMISSIONS.TRACKING_VIEW);

  const companyId = resolveCompanyId(auth, filters.companyId);

  const [company] = await db
    .select({
      id: companies.id,

      name: companies.name,

      timezone: companies.timezone,

      status: companies.status,
    })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (!company || company.status !== "active") {
    throw new DomainError(
      "TRACKING_COMPANY_INVALID",

      "La empresa seleccionada no existe o está inactiva.",
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FECHAS
  |--------------------------------------------------------------------------
  */

  if (filters.from && !isValidDateOnly(filters.from)) {
    throw new DomainError(
      "TRACKING_DATE_INVALID",

      "La fecha Desde no es válida.",
    );
  }

  if (filters.to && !isValidDateOnly(filters.to)) {
    throw new DomainError(
      "TRACKING_DATE_INVALID",

      "La fecha Hasta no es válida.",
    );
  }

  if (filters.from && filters.to && filters.from > filters.to) {
    throw new DomainError(
      "TRACKING_DATE_RANGE_INVALID",

      "La fecha Desde no puede ser posterior a Hasta.",
    );
  }

  return {
    auth,

    company,

    today: getTodayInTimeZone(company.timezone),
  };
}

/*
|--------------------------------------------------------------------------
| CONDICIONES BASE
|--------------------------------------------------------------------------
*/

function buildBaseConditions(
  companyId: string,

  filters: TrackingFilters,
) {
  const conditions: SQL[] = [eq(trackingActions.companyId, companyId)];

  /*
   * El filtro de fecha se aplica
   * a la fecha límite.
   */
  if (filters.from) {
    conditions.push(gte(trackingActions.dueDate, filters.from));
  }

  if (filters.to) {
    conditions.push(lte(trackingActions.dueDate, filters.to));
  }

  /*
   * Buscar SKU o producto.
   */
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;

    const searchCondition = or(
      ilike(inventoryItems.sku, term),

      ilike(inventoryItems.description, term),
    );

    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  return conditions;
}

/*
|--------------------------------------------------------------------------
| CONDICIÓN ESTADO
|--------------------------------------------------------------------------
*/

function getStatusCondition(
  status: TrackingDisplayStatus,

  today: string,
): SQL {
  switch (status) {
    case "executed":
      return eq(trackingActions.status, "executed");

    case "overdue":
      return and(
        eq(trackingActions.status, "pending"),

        lt(trackingActions.dueDate, today),
      )!;

    case "pending":
    default:
      return and(
        eq(trackingActions.status, "pending"),

        gte(trackingActions.dueDate, today),
      )!;
  }
}

/*
|--------------------------------------------------------------------------
| ESTADO VISUAL
|--------------------------------------------------------------------------
*/

function getDisplayStatus(
  status: "pending" | "executed",

  dueDate: string,

  today: string,
): TrackingDisplayStatus {
  if (status === "executed") {
    return "executed";
  }

  if (dueDate < today) {
    return "overdue";
  }

  return "pending";
}

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

export async function getTrackingDashboard(filters: TrackingFilters = {}) {
  const { company, today } = await resolveTrackingContext(filters);

  /*
   * Requisito:
   *
   * SIEMPRE 5 registros.
   */
  const pageSize = TRACKING_LIMITS.PAGE_SIZE;

  const requestedPage = Math.max(filters.page ?? 1, 1);

  /*
  |--------------------------------------------------------------------------
  | CONDICIONES
  |--------------------------------------------------------------------------
  */

  const baseConditions = buildBaseConditions(company.id, filters);

  /*
   * Para KPIs no aplicamos
   * filtro de estado.
   *
   * Así las tres tarjetas siempre
   * muestran el resumen completo
   * del periodo seleccionado.
   */
  const baseWhere = and(...baseConditions);

  /*
  |--------------------------------------------------------------------------
  | KPI
  |--------------------------------------------------------------------------
  */

  const [pendingResult, executedResult, overdueResult] = await Promise.all([
    db
      .select({
        total: count(),
      })
      .from(trackingActions)
      .innerJoin(
        inventoryItems,
        eq(inventoryItems.id, trackingActions.inventoryItemId),
      )
      .where(
        and(
          baseWhere,

          getStatusCondition("pending", today),
        ),
      ),

    db
      .select({
        total: count(),
      })
      .from(trackingActions)
      .innerJoin(
        inventoryItems,
        eq(inventoryItems.id, trackingActions.inventoryItemId),
      )
      .where(
        and(
          baseWhere,

          getStatusCondition("executed", today),
        ),
      ),

    db
      .select({
        total: count(),
      })
      .from(trackingActions)
      .innerJoin(
        inventoryItems,
        eq(inventoryItems.id, trackingActions.inventoryItemId),
      )
      .where(
        and(
          baseWhere,

          getStatusCondition("overdue", today),
        ),
      ),
  ]);

  const pending = pendingResult[0]?.total ?? 0;

  const executed = executedResult[0]?.total ?? 0;

  const overdue = overdueResult[0]?.total ?? 0;

  const total = pending + executed + overdue;

  /*
  |--------------------------------------------------------------------------
  | TABLA
  |--------------------------------------------------------------------------
  */

  const tableConditions = [...baseConditions];

  if (filters.status) {
    tableConditions.push(getStatusCondition(filters.status, today));
  }

  const tableWhere = and(...tableConditions);

  const [totalRows] = await db
    .select({
      total: count(),
    })
    .from(trackingActions)
    .innerJoin(
      inventoryItems,
      eq(inventoryItems.id, trackingActions.inventoryItemId),
    )
    .where(tableWhere);

  const tableTotal = totalRows?.total ?? 0;

  const totalPages = Math.max(Math.ceil(tableTotal / pageSize), 1);

  const page = Math.min(requestedPage, totalPages);

  const rows = await db
    .select({
      id: trackingActions.id,

      companyId: trackingActions.companyId,

      inventoryItemId: trackingActions.inventoryItemId,

      sku: inventoryItems.sku,

      description: inventoryItems.description,

      category: inventoryItems.category,

      brand: inventoryItems.brand,

      recommendationAction: trackingActions.recommendationAction,

      recommendationReason: trackingActions.recommendationReason,

      iriValue: trackingActions.iriValue,

      stockQuantity: trackingActions.stockQuantity,

      stockValue: trackingActions.stockValue,

      potentialRotationPercentage: trackingActions.potentialRotationPercentage,

      recommendationDate: trackingActions.recommendationDate,

      dueDate: trackingActions.dueDate,

      rawStatus: trackingActions.status,

      executedAt: trackingActions.executedAt,

      createdBy: trackingActions.createdBy,

      notes: trackingActions.notes,

      createdAt: trackingActions.createdAt,

      updatedAt: trackingActions.updatedAt,
    })
    .from(trackingActions)
    .innerJoin(
      inventoryItems,
      eq(inventoryItems.id, trackingActions.inventoryItemId),
    )
    .where(tableWhere)
    .orderBy(
      asc(trackingActions.dueDate),

      desc(trackingActions.createdAt),
    )
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const actions = rows.map((row) => {
    const status = getDisplayStatus(row.rawStatus, row.dueDate, today);

    return {
      ...row,

      status,

      daysOverdue:
        status === "overdue" ? differenceInDateOnlyDays(today, row.dueDate) : 0,
    };
  });

  /*
  |--------------------------------------------------------------------------
  | ACTIVIDADES RECIENTES
  |--------------------------------------------------------------------------
  |
  | No aplicamos filtro de due_date.
  |
  | "Actividades recientes" representa
  | la actividad operativa más reciente
  | de la empresa.
  |--------------------------------------------------------------------------
  */

  const recentActivities = await db
    .select({
      id: trackingActivities.id,

      trackingActionId: trackingActivities.trackingActionId,

      activityType: trackingActivities.activityType,

      description: trackingActivities.description,

      metadata: trackingActivities.metadata,

      createdAt: trackingActivities.createdAt,

      userId: trackingActivities.userId,

      userName: profiles.fullName,

      sku: inventoryItems.sku,

      productDescription: inventoryItems.description,

      recommendationAction: trackingActions.recommendationAction,
    })
    .from(trackingActivities)
    .innerJoin(
      trackingActions,
      eq(trackingActions.id, trackingActivities.trackingActionId),
    )
    .innerJoin(
      inventoryItems,
      eq(inventoryItems.id, trackingActions.inventoryItemId),
    )
    .leftJoin(profiles, eq(profiles.id, trackingActivities.userId))
    .where(eq(trackingActivities.companyId, company.id))
    .orderBy(desc(trackingActivities.createdAt))
    .limit(TRACKING_LIMITS.RECENT_ACTIVITIES);

  /*
  |--------------------------------------------------------------------------
  | ACCIONES VENCIDAS
  |--------------------------------------------------------------------------
  */

  const overdueConditions = buildBaseConditions(company.id, {
    ...filters,

    /*
     * búsqueda no debe limitar
     * el bloque de vencidas.
     */
    search: undefined,
  });

  const overdueRows = await db
    .select({
      id: trackingActions.id,

      inventoryItemId: trackingActions.inventoryItemId,

      sku: inventoryItems.sku,

      description: inventoryItems.description,

      recommendationAction: trackingActions.recommendationAction,

      iriValue: trackingActions.iriValue,

      stockValue: trackingActions.stockValue,

      dueDate: trackingActions.dueDate,
    })
    .from(trackingActions)
    .innerJoin(
      inventoryItems,
      eq(inventoryItems.id, trackingActions.inventoryItemId),
    )
    .where(
      and(
        ...overdueConditions,

        getStatusCondition("overdue", today),
      ),
    )
    .orderBy(
      asc(trackingActions.dueDate),

      desc(trackingActions.stockValue),
    )
    .limit(TRACKING_LIMITS.OVERDUE_ACTIONS);

  const overdueActions = overdueRows.map((row) => ({
    ...row,

    daysOverdue: differenceInDateOnlyDays(today, row.dueDate),
  }));

  /*
  |--------------------------------------------------------------------------
  | RESUMEN POR ESTADO
  |--------------------------------------------------------------------------
  */

  function percentage(value: number) {
    if (!total) {
      return 0;
    }

    return Math.round((value / total) * 10000) / 100;
  }

  return {
    filters: {
      companyId: company.id,

      companyName: company.name,

      from: filters.from ?? null,

      to: filters.to ?? null,

      status: filters.status ?? null,

      search: filters.search ?? null,

      today,
    },

    /*
    |--------------------------------------------------------------------------
    | KPI
    |--------------------------------------------------------------------------
    */

    summary: {
      pending,

      executed,

      overdue,

      total,
    },

    /*
    |--------------------------------------------------------------------------
    | TABLA - SIEMPRE 5
    |--------------------------------------------------------------------------
    */

    actions: {
      data: actions,

      total: tableTotal,

      page,

      pageSize,

      totalPages,
    },

    /*
    |--------------------------------------------------------------------------
    | ACTIVIDAD
    |--------------------------------------------------------------------------
    */

    recentActivities,

    /*
    |--------------------------------------------------------------------------
    | VENCIDAS
    |--------------------------------------------------------------------------
    */

    overdueActions,

    /*
    |--------------------------------------------------------------------------
    | RESUMEN
    |--------------------------------------------------------------------------
    */

    statusSummary: {
      pending: {
        count: pending,

        percentage: percentage(pending),
      },

      executed: {
        count: executed,

        percentage: percentage(executed),
      },

      overdue: {
        count: overdue,

        percentage: percentage(overdue),
      },
    },
  };
}

/*
|--------------------------------------------------------------------------
| DETALLE
|--------------------------------------------------------------------------
*/

export async function getTrackingActionById(trackingActionId: string) {
  const auth = await requireAuth();

  requirePermission(auth, PERMISSIONS.TRACKING_VIEW);

  const [action] = await db
    .select({
      id: trackingActions.id,

      companyId: trackingActions.companyId,

      inventoryItemId: trackingActions.inventoryItemId,

      sku: inventoryItems.sku,

      description: inventoryItems.description,

      category: inventoryItems.category,

      brand: inventoryItems.brand,

      location: inventoryItems.location,

      recommendationAction: trackingActions.recommendationAction,

      recommendationReason: trackingActions.recommendationReason,

      iriValue: trackingActions.iriValue,

      stockQuantity: trackingActions.stockQuantity,

      unitCost: trackingActions.unitCost,

      stockValue: trackingActions.stockValue,

      coverageDays: trackingActions.coverageDays,

      potentialRotationPercentage: trackingActions.potentialRotationPercentage,

      analysisFrom: trackingActions.analysisFrom,

      analysisTo: trackingActions.analysisTo,

      rawStatus: trackingActions.status,

      recommendationDate: trackingActions.recommendationDate,

      dueDate: trackingActions.dueDate,

      executedAt: trackingActions.executedAt,

      notes: trackingActions.notes,

      createdBy: trackingActions.createdBy,

      executedBy: trackingActions.executedBy,

      createdAt: trackingActions.createdAt,

      updatedAt: trackingActions.updatedAt,
    })
    .from(trackingActions)
    .innerJoin(
      inventoryItems,
      eq(inventoryItems.id, trackingActions.inventoryItemId),
    )
    .where(eq(trackingActions.id, trackingActionId))
    .limit(1);

  if (!action) {
    return null;
  }

  requireCompanyAccess(auth, action.companyId);

  const [company] = await db
    .select({
      timezone: companies.timezone,
    })
    .from(companies)
    .where(eq(companies.id, action.companyId))
    .limit(1);

  if (!company) {
    return null;
  }

  const today = getTodayInTimeZone(company.timezone);

  const status = getDisplayStatus(action.rawStatus, action.dueDate, today);

  const activities = await db
    .select({
      id: trackingActivities.id,

      activityType: trackingActivities.activityType,

      description: trackingActivities.description,

      metadata: trackingActivities.metadata,

      userId: trackingActivities.userId,

      userName: profiles.fullName,

      createdAt: trackingActivities.createdAt,
    })
    .from(trackingActivities)
    .leftJoin(profiles, eq(profiles.id, trackingActivities.userId))
    .where(eq(trackingActivities.trackingActionId, trackingActionId))
    .orderBy(desc(trackingActivities.createdAt));

  return {
    ...action,

    status,

    daysOverdue:
      status === "overdue"
        ? differenceInDateOnlyDays(today, action.dueDate)
        : 0,

    activities,
  };
}
