import { IRI_ANALYSIS, IRI_THRESHOLDS, IRI_WEIGHTS } from "@/config/iri";

import { RECOMMENDATION_RULES } from "@/config/recommendations";

import type {
  IriSettingsConfig,
  NotificationSettingsConfig,
  RecommendationSettingsConfig,
  ResolvedCompanySettings,
  TrafficLightSettingsConfig,
} from "@/lib/settings/types";

/*
|--------------------------------------------------------------------------
| IRI
|--------------------------------------------------------------------------
*/

export const DEFAULT_IRI_SETTINGS: IriSettingsConfig = {
  weights: {
    demand: IRI_WEIGHTS.demand,

    recency: IRI_WEIGHTS.recency,

    coverage: IRI_WEIGHTS.coverage,

    trend: IRI_WEIGHTS.trend,
  },

  thresholds: {
    high: IRI_THRESHOLDS.high,

    medium: IRI_THRESHOLDS.medium,
  },

  defaultDays: IRI_ANALYSIS.DEFAULT_DAYS,

  opportunityMinIri: IRI_ANALYSIS.OPPORTUNITY_MIN_IRI,

  demandReferencePercentile: IRI_ANALYSIS.DEMAND_REFERENCE_PERCENTILE,
};

/*
|--------------------------------------------------------------------------
| RECOMENDACIONES
|--------------------------------------------------------------------------
*/

export const DEFAULT_RECOMMENDATION_SETTINGS: RecommendationSettingsConfig = {
  healthyMinIri: RECOMMENDATION_RULES.HEALTHY_MIN_IRI,

  redistributeMinCoverageDays:
    RECOMMENDATION_RULES.REDISTRIBUTE_MIN_COVERAGE_DAYS,

  offerMinIri: RECOMMENDATION_RULES.OFFER_MIN_IRI,

  liquidateMaxIri: RECOMMENDATION_RULES.LIQUIDATE_MAX_IRI,
};

/*
|--------------------------------------------------------------------------
| SEMÁFOROS
|--------------------------------------------------------------------------
*/

export const DEFAULT_TRAFFIC_LIGHT_SETTINGS: TrafficLightSettingsConfig = {
  coverage: {
    healthyMaxDays: 90,

    warningMaxDays: 180,
  },

  tracking: {
    warningDays: 5,

    criticalDays: 2,
  },

  recovery: {
    high: 75,

    medium: 50,
  },
};

/*
|--------------------------------------------------------------------------
| NOTIFICACIONES
|--------------------------------------------------------------------------
*/

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsConfig = {
  trackingDueEnabled: true,

  trackingDueDays: 5,

  trackingOverdueEnabled: true,

  recoveryPendingEnabled: true,

  recoveryPendingDays: 7,
};

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN COMPLETA
|--------------------------------------------------------------------------
*/

export function createDefaultCompanySettings(): ResolvedCompanySettings {
  return {
    iri: {
      ...DEFAULT_IRI_SETTINGS,

      weights: {
        ...DEFAULT_IRI_SETTINGS.weights,
      },

      thresholds: {
        ...DEFAULT_IRI_SETTINGS.thresholds,
      },
    },

    recommendations: {
      ...DEFAULT_RECOMMENDATION_SETTINGS,
    },

    trafficLights: {
      coverage: {
        ...DEFAULT_TRAFFIC_LIGHT_SETTINGS.coverage,
      },

      tracking: {
        ...DEFAULT_TRAFFIC_LIGHT_SETTINGS.tracking,
      },

      recovery: {
        ...DEFAULT_TRAFFIC_LIGHT_SETTINGS.recovery,
      },
    },

    notifications: {
      ...DEFAULT_NOTIFICATION_SETTINGS,
    },
  };
}
