import "server-only";

import { and, eq, gte, lte } from "drizzle-orm";

import { PERMISSIONS } from "@/config/permissions";

import { RECOMMENDATION_ACTION_LABELS } from "@/config/recommendations";

import { db } from "@/db";

import { recoveryEvents } from "@/db/schema";

import type {
  MainDashboardFilters,
  MainDashboardResult,
  RotationTrendPoint,
  TrafficLightKey,
} from "@/lib/dashboard/types";

import { calculateRecommendations } from "@/lib/recommendations/calculate-recommendations";

import type {
  RecommendationAction,
  RecommendationItem,
} from "@/lib/recommendations/types";

import { shiftDateOnlyMonths } from "@/lib/recovery/date";

import { getIriDashboard } from "@/server/queries/iri.queries";

import { requireAuth } from "@/server/services/auth.service";

import {
  requirePermission,
  resolveCompanyId,
} from "@/server/services/authorization.service";

import { getCompanySettingsByCompanyId } from "@/server/services/settings.service";

const DAY_MS = 24 * 60 * 60 * 1000;

/*
|--------------------------------------------------------------------------
| SEMÁFORO
|--------------------------------------------------------------------------
|
| El Dashboard NO introduce reglas nuevas:
| simplemente mapea la acción de la recomendación
| a un semáforo.
|
*/

const TRAFFIC_LIGHT_MAP: Array<{
  key: TrafficLightKey;

  label: string;

  recommendationAction: RecommendationAction;
}> = [
  {
    key: "green",

    label: "Rotación normal",

    recommendationAction: "maintain",
  },

  {
    key: "yellow",

    label: "Rotación lenta",

    recommendationAction: "redistribute",
  },

  {
    key: "orange",

    label: "En riesgo",

    recommendationAction: "offer",
  },

  {
    key: "red",

    label: "Crítico",

    recommendationAction: "liquidate",
  },
];

const PRIORITY_ORDER: Record<RecommendationAction, number> = {
  liquidate: 0,

  offer: 1,

  redistribute: 2,

  maintain: 3,
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
| FECHAS
|--------------------------------------------------------------------------
*/

function daysWithoutMovement(
  lastMovementDate: Date | null,

  to: string,
) {
  if (!lastMovementDate) {
    return null;
  }

  const toDate = new Date(`${to}T00:00:00.000Z`);

  return Math.max(
    0,

    Math.floor((toDate.getTime() - lastMovementDate.getTime()) / DAY_MS),
  );
}

function previousMonthKey(monthKey: string, offset: number) {
  const [year, month] = monthKey.split("-").map(Number);

  const target = new Date(Date.UTC(year, month - 1 - offset, 1));

  return `${target.getUTCFullYear()}-${String(
    target.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
}

function lastDayOfMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return `${monthKey}-${String(lastDay).padStart(2, "0")}`;
}

function buildMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  const label = new Intl.DateTimeFormat("es-PE", {
    month: "long",
  }).format(new Date(Date.UTC(year, month - 1, 1)));

  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${year}`;
}

async function measure<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  const isDev = process.env.NODE_ENV !== "production";

  if (!isDev) {
    return fn();
  }

  const startedAt = performance.now();

  try {
    return await fn();
  } finally {
    const elapsed = performance.now() - startedAt;

    // eslint-disable-next-line no-console
    console.log(`[perf][dashboard] ${label}: ${elapsed.toFixed(1)}ms`);
  }
}

/*
|--------------------------------------------------------------------------
| CAPITAL RECUPERADO
|--------------------------------------------------------------------------
|
| Utilizamos recovery_date (fecha real de recuperación),
| no created_at.
|
*/

async function loadRecoveredTotal(
  companyId: string,

  from: string,

  to: string,
) {
  return measure(`recovery.query.${from}_${to}`, async () => {
    const rows = await db
      .select({
        recoveredValue: recoveryEvents.recoveredValue,
      })
      .from(recoveryEvents)
      .where(
        and(
          eq(recoveryEvents.companyId, companyId),

          gte(recoveryEvents.recoveryDate, from),

          lte(recoveryEvents.recoveryDate, to),
        ),
      );

    return rows.reduce(
      (total, row) => total + row.recoveredValue,

      0,
    );
  });
}

/*
|--------------------------------------------------------------------------
| TENDENCIA MENSUAL
|--------------------------------------------------------------------------
|
| La tendencia reconstruye el estado histórico real
| reutilizando el motor IRI para cada corte mensual.
|
| getIriDashboard() toma el último snapshot disponible
| de cada SKU hasta el final del mes, por lo que cada
| punto representa datos históricos reales y no el
| estado actual repetido.
|
| NOTA TÉCNICA (rendimiento):
|
| Cada corte ejecuta la misma consulta de snapshots
| que el periodo principal. Con trendMonths = 6 son
| hasta 6 consultas adicionales más el periodo actual
| y el anterior. Se ejecutan en paralelo y son
| consultas indexadas, por lo que se considera
| aceptable. Si en el futuro se requiere optimizar,
| se podrían reutilizar los cortes del periodo
| anterior evitando recalcular el mes más reciente.
|
*/

async function loadRotationTrend(
  companyId: string,

  to: string,

  trendMonths: 3 | 6,
): Promise<RotationTrendPoint[]> {
  const endMonthKey = to.slice(0, 7);

  const monthKeys: string[] = [];

  for (let offset = trendMonths - 1; offset >= 0; offset--) {
    monthKeys.push(previousMonthKey(endMonthKey, offset));
  }

  const settings = await getCompanySettingsByCompanyId(companyId);

  return Promise.all(
    monthKeys.map(async (monthKey) => {
      const iri = await getIriDashboard({
        companyId,

        from: `${monthKey}-01`,

        to: lastDayOfMonth(monthKey),
      });

      const recommendations = calculateRecommendations(
        iri.dashboard.items,

        settings.recommendations,
      );

      return {
        month: buildMonthLabel(monthKey),

        monthKey,

        maintain: recommendations.distribution.maintain.count,

        redistribute: recommendations.distribution.redistribute.count,

        offer: recommendations.distribution.offer.count,

        liquidate: recommendations.distribution.liquidate.count,

        iriAverage: iri.dashboard.summary.iriAverage,
      };
    }),
  );
}

/*
|--------------------------------------------------------------------------
| SKU PRIORITARIOS
|--------------------------------------------------------------------------
*/

function buildPrioritySkus(
  recommendations: RecommendationItem[],

  to: string,
) {
  return [...recommendations]
    .sort((a, b) => {
      const priorityDiff = PRIORITY_ORDER[a.action] - PRIORITY_ORDER[b.action];

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const aDays = a.lastMovementDate
        ? (daysWithoutMovement(a.lastMovementDate, to) ?? -1)
        : -1;

      const bDays = b.lastMovementDate
        ? (daysWithoutMovement(b.lastMovementDate, to) ?? -1)
        : -1;

      if (aDays !== bDays) {
        return bDays - aDays;
      }

      return b.stockValue - a.stockValue;
    })
    .slice(0, 5)
    .map((item) => {
      const statusEntry = TRAFFIC_LIGHT_MAP.find(
        (entry) => entry.recommendationAction === item.action,
      )!;

      return {
        inventoryItemId: item.id,

        sku: item.sku,

        description: item.description,

        category: item.category,

        brand: item.brand,

        daysWithoutMovement: daysWithoutMovement(
          item.lastMovementDate,

          to,
        ),

        iri: item.iri,

        recommendationAction: item.action,

        recommendationLabel: RECOMMENDATION_ACTION_LABELS[item.action],

        status: statusEntry.key,

        statusLabel: statusEntry.label,

        stockQuantity: item.stockQuantity,

        stockValue: item.stockValue,
      };
    });
}

/*
|--------------------------------------------------------------------------
| DASHBOARD PRINCIPAL
|--------------------------------------------------------------------------
*/

export async function getMainDashboard(
  filters: MainDashboardFilters = {},
): Promise<MainDashboardResult> {
  /*
  |--------------------------------------------------------------------------
  | AUTORIZACIÓN
  |--------------------------------------------------------------------------
  |
  | - User: auth.company.id
  | - Admin: companyId solicitado
  |
  */

  const auth = await requireAuth();

  requirePermission(auth, PERMISSIONS.DASHBOARD_VIEW);

  const companyId = resolveCompanyId(auth, filters.companyId);

  const trendMonths = filters.trendMonths === 3 ? 3 : 6;

  /*
  |--------------------------------------------------------------------------
  | PERIODO ACTUAL
  |--------------------------------------------------------------------------
  |
  | getIriDashboard resuelve las fechas con las
  | mismas reglas del IRI (máximo 180 días) y
  | respeta la configuración de la empresa.
  |
  */

  const iriResult = await getIriDashboard({
    companyId,

    from: filters.from,

    to: filters.to,
  });

  const settings = await getCompanySettingsByCompanyId(
    iriResult.filters.companyId,
  );

  const currentRecommendations = calculateRecommendations(
    iriResult.dashboard.items,

    settings.recommendations,
  );

  /*
  |--------------------------------------------------------------------------
  | PERIODO ANTERIOR
  |--------------------------------------------------------------------------
  |
  | Misma estrategia que Recuperación:
  | desplazar el rango un mes atrás.
  |
  */

  const previousFrom = shiftDateOnlyMonths(iriResult.filters.from, -1);

  const previousTo = shiftDateOnlyMonths(iriResult.filters.to, -1);

  const [previousIriResult, currentRecovered, previousRecovered] =
    await Promise.all([
      getIriDashboard({
        companyId,

        from: previousFrom,

        to: previousTo,
      }),

      loadRecoveredTotal(
        companyId,

        iriResult.filters.from,

        iriResult.filters.to,
      ),

      loadRecoveredTotal(companyId, previousFrom, previousTo),
    ]);

  const previousRecommendations = calculateRecommendations(
    previousIriResult.dashboard.items,

    settings.recommendations,
  );

  /*
  |--------------------------------------------------------------------------
  | KPI
  |--------------------------------------------------------------------------
  */

  const currentSkuAnalyzed =
    currentRecommendations.summary.totalRecommendations;

  const previousSkuAnalyzed =
    previousRecommendations.summary.totalRecommendations;

  const currentImmobilized =
    currentRecommendations.summary.capitalInvolved;

  const previousImmobilized =
    previousRecommendations.summary.capitalInvolved;

  const currentCritical = currentRecommendations.recommendations.filter(
    (item) => item.action === "liquidate",
  ).length;

  const previousCritical = previousRecommendations.recommendations.filter(
    (item) => item.action === "liquidate",
  ).length;

  const currentRecoverable =
    currentRecommendations.summary.potentialRotationValue;

  const previousRecoverable =
    previousRecommendations.summary.potentialRotationValue;

  /*
  |--------------------------------------------------------------------------
  | SEMÁFORO
  |--------------------------------------------------------------------------
  */

  const trafficLightTotal = currentSkuAnalyzed;

  const trafficLightDistribution = TRAFFIC_LIGHT_MAP.map((entry) => {
    const count = currentRecommendations.recommendations.filter(
      (item) => item.action === entry.recommendationAction,
    ).length;

    return {
      key: entry.key,

      label: entry.label,

      recommendationAction: entry.recommendationAction,

      count,

      percentage: trafficLightTotal
        ? round((count / trafficLightTotal) * 100)
        : 0,
    };
  });

  /*
  |--------------------------------------------------------------------------
  | TENDENCIA Y SKU PRIORITARIOS
  |--------------------------------------------------------------------------
  */

  const rotationTrend = await loadRotationTrend(
    companyId,

    iriResult.filters.to,

    trendMonths,
  );

  const prioritySkus = buildPrioritySkus(
    currentRecommendations.recommendations,

    iriResult.filters.to,
  );

  /*
  |--------------------------------------------------------------------------
  | RESPUESTA
  |--------------------------------------------------------------------------
  */

  return {
    filters: {
      companyId: iriResult.filters.companyId,

      companyName: iriResult.filters.companyName,

      from: iriResult.filters.from,

      to: iriResult.filters.to,

      previousFrom,

      previousTo,

      trendMonths,
    },

    kpis: {
      skuAnalyzed: {
        current: currentSkuAnalyzed,

        previous: previousSkuAnalyzed,

        changePercentage: percentageChange(
          currentSkuAnalyzed,

          previousSkuAnalyzed,
        ),
      },

      immobilizedCapital: {
        current: round(currentImmobilized),

        previous: round(previousImmobilized),

        changePercentage: percentageChange(
          currentImmobilized,

          previousImmobilized,
        ),
      },

      criticalSku: {
        current: currentCritical,

        previous: previousCritical,

        changePercentage: percentageChange(
          currentCritical,

          previousCritical,
        ),
      },

      recoverableCapital: {
        current: round(currentRecoverable),

        previous: round(previousRecoverable),

        changePercentage: percentageChange(
          currentRecoverable,

          previousRecoverable,
        ),
      },

      recoveredCapital: {
        current: round(currentRecovered),

        previous: round(previousRecovered),

        changePercentage: percentageChange(
          currentRecovered,

          previousRecovered,
        ),
      },
    },

    trafficLightDistribution,

    rotationTrend,

    prioritySkus,
  };
}