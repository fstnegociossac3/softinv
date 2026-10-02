import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { REPORT_LIMITS, type ReportType } from "@/config/reports";

import { db } from "@/db";

import {
  inventoryItems,
  recoveryCases,
  recoveryEvents,
  trackingActions,
} from "@/db/schema";

import { calculateRecommendations } from "@/lib/recommendations/calculate-recommendations";

import { countInclusiveDays } from "@/lib/recovery/date";

import type {
  ReportCompanyMetadata,
  ReportGeneratedBy,
  ReportSnapshot,
} from "@/lib/reports/types";

import { getIriDashboard } from "@/server/queries/iri.queries";

import { getRecoveryDashboard } from "@/server/queries/recovery.queries";

import { getTrackingDashboard } from "@/server/queries/tracking.queries";

import { getCompanySettingsByCompanyId } from "@/server/services/settings.service";

/*
|--------------------------------------------------------------------------
| JSON SAFE
|--------------------------------------------------------------------------
|
| Convierte:
|
| Date -> string ISO
| undefined -> eliminado
|
*/

function toJsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;

  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/*
|--------------------------------------------------------------------------
| RECUPERACIÓN COMPLETA
|--------------------------------------------------------------------------
|
| getRecoveryDashboard()
| devuelve tabla paginada de 5.
|
| Para el reporte necesitamos
| TODAS las acciones del periodo.
|
*/

async function loadFullRecoveryActions(
  companyId: string,
  timezone: string,
  from: string,
  to: string,
) {
  const fromCondition = sql`
      (
        ${recoveryCases.startedAt}
        AT TIME ZONE
        ${timezone}
      )::date
      >=
      ${from}::date
    `;

  const toCondition = sql`
      (
        ${recoveryCases.startedAt}
        AT TIME ZONE
        ${timezone}
      )::date
      <=
      ${to}::date
    `;

  const caseRows = await db
    .select({
      id: recoveryCases.id,

      trackingActionId: recoveryCases.trackingActionId,

      inventoryItemId: recoveryCases.inventoryItemId,

      sku: inventoryItems.sku,

      description: inventoryItems.description,

      category: inventoryItems.category,

      brand: inventoryItems.brand,

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
        eq(recoveryCases.companyId, companyId),

        fromCondition,

        toCondition,
      ),
    )
    .orderBy(desc(recoveryCases.startedAt));

  if (!caseRows.length) {
    return [];
  }

  const caseIds = caseRows.map((item) => item.id);

  const events = await db
    .select({
      recoveryCaseId: recoveryEvents.recoveryCaseId,

      quantity: recoveryEvents.quantity,

      recoveredValue: recoveryEvents.recoveredValue,

      recoveryDate: recoveryEvents.recoveryDate,
    })
    .from(recoveryEvents)
    .where(inArray(recoveryEvents.recoveryCaseId, caseIds));

  return caseRows.map((recoveryCase) => {
    const caseEvents = events.filter(
      (event) => event.recoveryCaseId === recoveryCase.id,
    );

    const recoveredUnits = caseEvents.reduce(
      (total, event) => total + event.quantity,

      0,
    );

    const recoveredValue = caseEvents.reduce(
      (total, event) => total + event.recoveredValue,

      0,
    );

    const recoveryRate =
      recoveryCase.potentialRecoverableValue > 0
        ? (recoveredValue / recoveryCase.potentialRecoverableValue) * 100
        : 0;

    return {
      ...recoveryCase,

      recoveredUnits: round(recoveredUnits, 4),

      recoveredValue: round(recoveredValue),

      recoveryRate: round(recoveryRate),

      events: caseEvents,
    };
  });
}

/*
|--------------------------------------------------------------------------
| INVENTARIO GENERAL
|--------------------------------------------------------------------------
*/

function buildInventorySummary(
  items: Awaited<ReturnType<typeof getIriDashboard>>["dashboard"]["items"],
) {
  const stocked = items.filter((item) => item.stockQuantity > 0);

  return {
    totalSku: items.length,

    skuWithStock: stocked.length,

    totalUnits: round(
      stocked.reduce(
        (total, item) => total + item.stockQuantity,

        0,
      ),

      4,
    ),

    totalStockValue: round(
      stocked.reduce(
        (total, item) => total + item.stockValue,

        0,
      ),
    ),
  };
}

/*
|--------------------------------------------------------------------------
| INVENTARIO CRÍTICO
|--------------------------------------------------------------------------
|
| Consideramos crítico todo SKU
| cuya recomendación no sea Mantener.
|
*/

function buildCriticalInventory(
  recommendations: ReturnType<
    typeof calculateRecommendations
  >["recommendations"],
) {
  const priority = {
    liquidate: 1,
    offer: 2,
    redistribute: 3,
    maintain: 4,
  } as const;

  const items = recommendations
    .filter((item) => item.action !== "maintain")
    .sort((a, b) => {
      const byAction = priority[a.action] - priority[b.action];

      if (byAction !== 0) {
        return byAction;
      }

      return b.stockValue - a.stockValue;
    });

  return {
    summary: {
      totalCriticalSku: items.length,

      criticalStockValue: round(
        items.reduce(
          (total, item) => total + item.stockValue,

          0,
        ),
      ),

      redistribute: items.filter((item) => item.action === "redistribute")
        .length,

      offer: items.filter((item) => item.action === "offer").length,

      liquidate: items.filter((item) => item.action === "liquidate").length,
    },

    items,
  };
}

/*
|--------------------------------------------------------------------------
| SNAPSHOT
|--------------------------------------------------------------------------
*/

type BuildReportParams = {
  type: ReportType;

  company: ReportCompanyMetadata;

  generatedBy: ReportGeneratedBy;

  from: string;

  to: string;

  generatedAt: Date;
};

export async function buildReportSnapshot({
  type,
  company,
  generatedBy,
  from,
  to,
  generatedAt,
}: BuildReportParams): Promise<ReportSnapshot> {
  /*
   * Todos estos reportes dependen
   * de IRI.
   */
  const iri = await getIriDashboard({
    companyId: company.id,

    from,

    to,
  });

  /*
   * Configuración específica
   * de la empresa.
   */
  const settings = await getCompanySettingsByCompanyId(company.id);

  /*
   * Recomendaciones completas
   * utilizando las reglas
   * específicas de la empresa.
   */
  const recommendations = calculateRecommendations(
    iri.dashboard.items,

    settings.recommendations,
  );

  const common = {
    schemaVersion: REPORT_LIMITS.SNAPSHOT_VERSION,

    type,

    generatedAt: generatedAt.toISOString(),

    company,

    period: {
      from,

      to,

      days: countInclusiveDays(from, to),
    },

    generatedBy,
  };

  /*
  |--------------------------------------------------------------------------
  | REPORTE EJECUTIVO
  |--------------------------------------------------------------------------
  */

  if (type === "executive") {
    const [tracking, recovery] = await Promise.all([
      getTrackingDashboard({
        companyId: company.id,

        from,

        to,
      }),

      getRecoveryDashboard({
        companyId: company.id,

        from,

        to,
      }),
    ]);

    const critical = buildCriticalInventory(recommendations.recommendations);

    return toJsonSafe({
      ...common,

      data: {
        inventory: buildInventorySummary(iri.dashboard.items),

        iri: {
          summary: iri.dashboard.summary,

          distribution: iri.dashboard.distribution,

          variableAverages: iri.dashboard.variableAverages,
        },

        recommendations: {
          summary: recommendations.summary,

          distribution: recommendations.distribution,
        },

        tracking: {
          summary: tracking.summary,

          statusSummary: tracking.statusSummary,
        },

        recovery: {
          kpis: recovery.kpis,

          periodTotal: recovery.periodTotal,

          comparisonByAction: recovery.comparisonByAction,
        },

        /*
         * Resumen de SKU críticos.
         *
         * El Ejecutivo no necesita
         * miles de filas.
         */
        criticalHighlights: critical.items.slice(0, 10),
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | INVENTARIO CRÍTICO
  |--------------------------------------------------------------------------
  */

  if (type === "critical_inventory") {
    const critical = buildCriticalInventory(recommendations.recommendations);

    return toJsonSafe({
      ...common,

      data: {
        inventory: buildInventorySummary(iri.dashboard.items),

        iri: {
          summary: iri.dashboard.summary,

          distribution: iri.dashboard.distribution,
        },

        criticalSummary: critical.summary,

        /*
         * TODOS los SKU críticos.
         */
        items: critical.items,
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | RECOMENDACIONES
  |--------------------------------------------------------------------------
  */

  if (type === "recommendations") {
    return toJsonSafe({
      ...common,

      data: {
        summary: recommendations.summary,

        distribution: recommendations.distribution,

        /*
         * TODAS las recomendaciones.
         */
        recommendations: recommendations.recommendations,
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | RECUPERACIÓN
  |--------------------------------------------------------------------------
  */

  const recovery = await getRecoveryDashboard({
    companyId: company.id,

    from,

    to,
  });

  const fullActions = await loadFullRecoveryActions(
    company.id,
    company.timezone,
    from,
    to,
  );

  return toJsonSafe({
    ...common,

    data: {
      kpis: recovery.kpis,

      recoveredOverTime: recovery.recoveredOverTime,

      comparisonByAction: recovery.comparisonByAction,

      periodTotal: recovery.periodTotal,

      /*
       * TODAS las acciones.
       */
      actions: fullActions,
    },
  });
}
