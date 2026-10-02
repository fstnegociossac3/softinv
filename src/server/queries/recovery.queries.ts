import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";

import { RECOVERY_LIMITS } from "@/config/recovery";

import { RECOMMENDATION_ACTION_LABELS } from "@/config/recommendations";

import { PERMISSIONS } from "@/config/permissions";

import { db } from "@/db";

import {
  companies,
  inventoryItems,
  recoveryCases,
  recoveryEvents,
  trackingActions,
} from "@/db/schema";

import {
  countInclusiveDays,
  getDefaultRecoveryRange,
  isValidDateOnly,
  shiftDateOnlyMonths,
} from "@/lib/recovery/date";

import { DomainError } from "@/server/errors/domain.error";

import { getRecommendationsDashboard } from "@/server/queries/recommendation.queries";

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

export type RecoveryFilters = {
  companyId?: string;

  from?: string;

  to?: string;

  page?: number;
};

/*
|--------------------------------------------------------------------------
| UTILIDADES
|--------------------------------------------------------------------------
*/

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;

  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return round(((current - previous) / previous) * 100);
}

/*
|--------------------------------------------------------------------------
| CONTEXTO
|--------------------------------------------------------------------------
*/

async function resolveRecoveryContext(filters: RecoveryFilters) {
  const auth = await requireAuth();

  requirePermission(auth, PERMISSIONS.RECOVERY_VIEW);

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
      "RECOVERY_COMPANY_INVALID",

      "La empresa seleccionada no existe o está inactiva.",
    );
  }

  const defaultRange = getDefaultRecoveryRange(company.timezone);

  const from = filters.from ?? defaultRange.from;

  const to = filters.to ?? defaultRange.to;

  if (!isValidDateOnly(from) || !isValidDateOnly(to)) {
    throw new DomainError(
      "RECOVERY_DATE_INVALID",

      "El rango de fechas no es válido.",
    );
  }

  if (from > to) {
    throw new DomainError(
      "RECOVERY_DATE_RANGE_INVALID",

      "La fecha Desde no puede ser posterior a Hasta.",
    );
  }

  const days = countInclusiveDays(from, to);

  if (days > RECOVERY_LIMITS.MAX_ANALYSIS_DAYS) {
    throw new DomainError(
      "RECOVERY_DATE_RANGE_TOO_LARGE",

      `El periodo máximo es de ${RECOVERY_LIMITS.MAX_ANALYSIS_DAYS} días.`,
    );
  }

  const previousFrom = shiftDateOnlyMonths(from, -1);

  const previousTo = shiftDateOnlyMonths(to, -1);

  return {
    auth,

    company,

    from,

    to,

    previousFrom,

    previousTo,

    days,
  };
}

/*
|--------------------------------------------------------------------------
| EVENTOS DEL PERIODO
|--------------------------------------------------------------------------
*/

async function loadPeriodEvents(companyId: string, from: string, to: string) {
  return db
    .select({
      id: recoveryEvents.id,

      recoveryCaseId: recoveryEvents.recoveryCaseId,

      quantity: recoveryEvents.quantity,

      recoveredValue: recoveryEvents.recoveredValue,

      recoveryDate: recoveryEvents.recoveryDate,

      recommendationAction: recoveryCases.recommendationAction,
    })
    .from(recoveryEvents)
    .innerJoin(
      recoveryCases,
      eq(recoveryCases.id, recoveryEvents.recoveryCaseId),
    )
    .where(
      and(
        eq(recoveryEvents.companyId, companyId),

        gte(recoveryEvents.recoveryDate, from),

        lte(recoveryEvents.recoveryDate, to),
      ),
    )
    .orderBy(asc(recoveryEvents.recoveryDate));
}

/*
|--------------------------------------------------------------------------
| SERIE TEMPORAL
|--------------------------------------------------------------------------
*/

function buildTimeSeries(
  events: Awaited<ReturnType<typeof loadPeriodEvents>>,

  from: string,
  to: string,
) {
  const days = countInclusiveDays(from, to);

  /*
   * Hasta 62 días:
   * un punto por día.
   */
  if (days <= 62) {
    const totals = new Map<string, number>();

    for (const event of events) {
      totals.set(
        event.recoveryDate,

        (totals.get(event.recoveryDate) ?? 0) + event.recoveredValue,
      );
    }

    const result: Array<{
      period: string;
      recoveredValue: number;
    }> = [];

    let cursor = new Date(`${from}T00:00:00.000Z`);

    const end = new Date(`${to}T00:00:00.000Z`);

    while (cursor <= end) {
      const period = cursor.toISOString().slice(0, 10);

      result.push({
        period,

        recoveredValue: round(totals.get(period) ?? 0),
      });

      cursor = new Date(cursor.getTime() + 86400000);
    }

    return result;
  }

  /*
   * Más de 62 días:
   * agrupación mensual.
   */
  const totals = new Map<string, number>();

  for (const event of events) {
    const month = event.recoveryDate.slice(0, 7);

    totals.set(
      month,

      (totals.get(month) ?? 0) + event.recoveredValue,
    );
  }

  const start = new Date(`${from.slice(0, 7)}-01T00:00:00.000Z`);

  const end = new Date(`${to.slice(0, 7)}-01T00:00:00.000Z`);

  const result: Array<{
    period: string;
    recoveredValue: number;
  }> = [];

  let cursor = start;

  while (cursor <= end) {
    const month = cursor.toISOString().slice(0, 7);

    result.push({
      period: month,

      recoveredValue: round(totals.get(month) ?? 0),
    });

    cursor = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1),
    );
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| COMPARACIÓN POR ACCIÓN
|--------------------------------------------------------------------------
*/

function buildActionComparison(
  currentEvents: Awaited<ReturnType<typeof loadPeriodEvents>>,

  previousEvents: Awaited<ReturnType<typeof loadPeriodEvents>>,
) {
  const actions = ["maintain", "redistribute", "offer", "liquidate"] as const;

  return actions.map((action) => {
    const current = currentEvents
      .filter((event) => event.recommendationAction === action)
      .reduce(
        (total, event) => total + event.recoveredValue,

        0,
      );

    const previous = previousEvents
      .filter((event) => event.recommendationAction === action)
      .reduce(
        (total, event) => total + event.recoveredValue,

        0,
      );

    return {
      action,

      label: RECOMMENDATION_ACTION_LABELS[action],

      current: round(current),

      previous: round(previous),
    };
  });
}

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

export async function getRecoveryDashboard(filters: RecoveryFilters = {}) {
  const context = await resolveRecoveryContext(filters);

  const { company, from, to, previousFrom, previousTo } = context;

  /*
  |--------------------------------------------------------------------------
  | RECOMENDACIONES ACTUAL VS MES ANTERIOR
  |--------------------------------------------------------------------------
  */

  const [
    currentRecommendations,
    previousRecommendations,
    currentEvents,
    previousEvents,
  ] = await Promise.all([
    getRecommendationsDashboard({
      companyId: company.id,

      from,

      to,
    }),

    getRecommendationsDashboard({
      companyId: company.id,

      from: previousFrom,

      to: previousTo,
    }),

    loadPeriodEvents(company.id, from, to),

    loadPeriodEvents(company.id, previousFrom, previousTo),
  ]);

  /*
  |--------------------------------------------------------------------------
  | CAPITAL
  |--------------------------------------------------------------------------
  */

  const immobilizedCurrent = currentRecommendations.summary.capitalInvolved;

  const immobilizedPrevious = previousRecommendations.summary.capitalInvolved;

  const potentialCurrent =
    currentRecommendations.summary.potentialRotationValue;

  const potentialPrevious =
    previousRecommendations.summary.potentialRotationValue;

  const recoveredCurrent = currentEvents.reduce(
    (total, event) => total + event.recoveredValue,

    0,
  );

  const recoveredPrevious = previousEvents.reduce(
    (total, event) => total + event.recoveredValue,

    0,
  );

  const recoveryRateCurrent =
    potentialCurrent > 0 ? (recoveredCurrent / potentialCurrent) * 100 : 0;

  const recoveryRatePrevious =
    potentialPrevious > 0 ? (recoveredPrevious / potentialPrevious) * 100 : 0;

  /*
  |--------------------------------------------------------------------------
  | TABLA — 5 REGISTROS
  |--------------------------------------------------------------------------
  */

  const pageSize = RECOVERY_LIMITS.PAGE_SIZE;

  const requestedPage = Math.max(filters.page ?? 1, 1);

  /*
   * started_at se compara en
   * la zona horaria de la empresa.
   */
  const startedDateConditionFrom = sql`
      (
        ${recoveryCases.startedAt}
        AT TIME ZONE
        ${company.timezone}
      )::date
      >=
      ${from}::date
    `;

  const startedDateConditionTo = sql`
      (
        ${recoveryCases.startedAt}
        AT TIME ZONE
        ${company.timezone}
      )::date
      <=
      ${to}::date
    `;

  const [totalRow] = await db
    .select({
      total: count(),
    })
    .from(recoveryCases)
    .where(
      and(
        eq(recoveryCases.companyId, company.id),

        startedDateConditionFrom,

        startedDateConditionTo,
      ),
    );

  const tableTotal = totalRow?.total ?? 0;

  const totalPages = Math.max(Math.ceil(tableTotal / pageSize), 1);

  const page = Math.min(requestedPage, totalPages);

  const caseRows = await db
    .select({
      id: recoveryCases.id,

      trackingActionId: recoveryCases.trackingActionId,

      inventoryItemId: recoveryCases.inventoryItemId,

      sku: inventoryItems.sku,

      description: inventoryItems.description,

      recommendationAction: recoveryCases.recommendationAction,

      initialStockQuantity: recoveryCases.initialStockQuantity,

      initialUnitCost: recoveryCases.initialUnitCost,

      initialStockValue: recoveryCases.initialStockValue,

      potentialRecoverableValue: recoveryCases.potentialRecoverableValue,

      status: recoveryCases.status,

      startedAt: recoveryCases.startedAt,

      executedAt: trackingActions.executedAt,

      closedAt: recoveryCases.closedAt,
    })
    .from(recoveryCases)
    .innerJoin(
      inventoryItems,
      eq(inventoryItems.id, recoveryCases.inventoryItemId),
    )
    .innerJoin(
      trackingActions,
      eq(trackingActions.id, recoveryCases.trackingActionId),
    )
    .where(
      and(
        eq(recoveryCases.companyId, company.id),

        startedDateConditionFrom,

        startedDateConditionTo,
      ),
    )
    .orderBy(desc(recoveryCases.startedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const caseIds = caseRows.map((row) => row.id);

  const caseEvents = caseIds.length
    ? await db
        .select({
          recoveryCaseId: recoveryEvents.recoveryCaseId,

          quantity: recoveryEvents.quantity,

          recoveredValue: recoveryEvents.recoveredValue,

          recoveryDate: recoveryEvents.recoveryDate,
        })
        .from(recoveryEvents)
        .where(inArray(recoveryEvents.recoveryCaseId, caseIds))
    : [];

  const actions = caseRows.map((recoveryCase) => {
    const events = caseEvents.filter(
      (event) => event.recoveryCaseId === recoveryCase.id,
    );

    const recoveredUnits = events.reduce(
      (total, event) => total + event.quantity,

      0,
    );

    const recoveredValue = events.reduce(
      (total, event) => total + event.recoveredValue,

      0,
    );

    const recoveryRate =
      recoveryCase.potentialRecoverableValue > 0
        ? (recoveredValue / recoveryCase.potentialRecoverableValue) * 100
        : 0;

    const lastRecoveryDate = events.length
      ? (events
          .map((event) => event.recoveryDate)
          .sort()
          .at(-1) ?? null)
      : null;

    return {
      ...recoveryCase,

      recoveredUnits: round(recoveredUnits, 4),

      recoveredValue: round(recoveredValue),

      recoveryRate: round(recoveryRate),

      lastRecoveryDate,
    };
  });

  /*
  |--------------------------------------------------------------------------
  | TOTAL DEL PERIODO
  |--------------------------------------------------------------------------
  */

  const recoveredUnits = currentEvents.reduce(
    (total, event) => total + event.quantity,

    0,
  );

  const caseSet = new Set(currentEvents.map((event) => event.recoveryCaseId));

  return {
    filters: {
      companyId: company.id,

      companyName: company.name,

      from,

      to,

      previousFrom,

      previousTo,
    },

    /*
    |--------------------------------------------------------------------------
    | 2 - 5 KPI
    |--------------------------------------------------------------------------
    */

    kpis: {
      immobilizedCapital: {
        current: round(immobilizedCurrent),

        previous: round(immobilizedPrevious),

        changePercent: percentageChange(
          immobilizedCurrent,
          immobilizedPrevious,
        ),
      },

      potentiallyRecoverableCapital: {
        current: round(potentialCurrent),

        previous: round(potentialPrevious),

        changePercent: percentageChange(potentialCurrent, potentialPrevious),
      },

      recoveredCapital: {
        current: round(recoveredCurrent),

        previous: round(recoveredPrevious),

        changePercent: percentageChange(recoveredCurrent, recoveredPrevious),
      },

      recoveryRate: {
        current: round(recoveryRateCurrent),

        previous: round(recoveryRatePrevious),

        /*
         * Puntos porcentuales.
         */
        changePoints: round(recoveryRateCurrent - recoveryRatePrevious),
      },
    },

    /*
    |--------------------------------------------------------------------------
    | 6. CAPITAL RECUPERADO EN EL TIEMPO
    |--------------------------------------------------------------------------
    */

    recoveredOverTime: buildTimeSeries(currentEvents, from, to),

    /*
    |--------------------------------------------------------------------------
    | 7. COMPARATIVO
    |--------------------------------------------------------------------------
    */

    comparisonByAction: buildActionComparison(currentEvents, previousEvents),

    /*
    |--------------------------------------------------------------------------
    | 8. TABLA
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
    | 9. TOTAL DEL PERIODO
    |--------------------------------------------------------------------------
    */

    periodTotal: {
      recoveredCapital: round(recoveredCurrent),

      recoveredUnits: round(recoveredUnits, 4),

      casesWithRecovery: caseSet.size,

      events: currentEvents.length,
    },
  };
}

/*
|--------------------------------------------------------------------------
| DETALLE
|--------------------------------------------------------------------------
*/

export async function getRecoveryCaseById(recoveryCaseId: string) {
  const auth = await requireAuth();

  requirePermission(auth, PERMISSIONS.RECOVERY_VIEW);

  const [recoveryCase] = await db
    .select({
      id: recoveryCases.id,

      companyId: recoveryCases.companyId,

      trackingActionId: recoveryCases.trackingActionId,

      inventoryItemId: recoveryCases.inventoryItemId,

      sku: inventoryItems.sku,

      description: inventoryItems.description,

      category: inventoryItems.category,

      brand: inventoryItems.brand,

      location: inventoryItems.location,

      recommendationAction: recoveryCases.recommendationAction,

      initialStockQuantity: recoveryCases.initialStockQuantity,

      initialUnitCost: recoveryCases.initialUnitCost,

      initialStockValue: recoveryCases.initialStockValue,

      potentialRecoverableValue: recoveryCases.potentialRecoverableValue,

      status: recoveryCases.status,

      startedAt: recoveryCases.startedAt,

      closedAt: recoveryCases.closedAt,

      executedAt: trackingActions.executedAt,

      createdAt: recoveryCases.createdAt,

      updatedAt: recoveryCases.updatedAt,
    })
    .from(recoveryCases)
    .innerJoin(
      inventoryItems,
      eq(inventoryItems.id, recoveryCases.inventoryItemId),
    )
    .innerJoin(
      trackingActions,
      eq(trackingActions.id, recoveryCases.trackingActionId),
    )
    .where(eq(recoveryCases.id, recoveryCaseId))
    .limit(1);

  if (!recoveryCase) {
    return null;
  }

  requireCompanyAccess(auth, recoveryCase.companyId);

  const events = await db
    .select({
      id: recoveryEvents.id,

      quantity: recoveryEvents.quantity,

      recoveredValue: recoveryEvents.recoveredValue,

      recoveryDate: recoveryEvents.recoveryDate,

      notes: recoveryEvents.notes,

      createdBy: recoveryEvents.createdBy,

      createdAt: recoveryEvents.createdAt,
    })
    .from(recoveryEvents)
    .where(eq(recoveryEvents.recoveryCaseId, recoveryCase.id))
    .orderBy(
      desc(recoveryEvents.recoveryDate),

      desc(recoveryEvents.createdAt),
    );

  const recoveredUnits = events.reduce(
    (total, event) => total + event.quantity,

    0,
  );

  const recoveredValue = events.reduce(
    (total, event) => total + event.recoveredValue,

    0,
  );

  return {
    ...recoveryCase,

    recoveredUnits: round(recoveredUnits, 4),

    recoveredValue: round(recoveredValue),

    pendingUnits: round(
      Math.max(
        recoveryCase.initialStockQuantity - recoveredUnits,

        0,
      ),

      4,
    ),

    recoveryRate:
      recoveryCase.potentialRecoverableValue > 0
        ? round((recoveredValue / recoveryCase.potentialRecoverableValue) * 100)
        : 0,

    events,
  };
}
