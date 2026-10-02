import { z } from "zod";

/*
|--------------------------------------------------------------------------
| IRI
|--------------------------------------------------------------------------
*/

export const iriSettingsSchema = z
  .object({
    weights: z.object({
      demand: z.coerce.number().min(0).max(1),

      recency: z.coerce.number().min(0).max(1),

      coverage: z.coerce.number().min(0).max(1),

      trend: z.coerce.number().min(0).max(1),
    }),

    thresholds: z.object({
      high: z.coerce.number().min(0).max(100),

      medium: z.coerce.number().min(0).max(100),
    }),

    defaultDays: z.coerce.number().int().min(1).max(180),

    opportunityMinIri: z.coerce.number().min(0).max(100),

    demandReferencePercentile: z.coerce.number().min(0.5).max(1),
  })
  .superRefine((value, ctx) => {
    const total =
      value.weights.demand +
      value.weights.recency +
      value.weights.coverage +
      value.weights.trend;

    if (Math.abs(total - 1) > 0.0001) {
      ctx.addIssue({
        code: "custom",

        path: ["weights"],

        message: "La suma de los pesos del IRI debe ser 100%.",
      });
    }

    if (value.thresholds.medium >= value.thresholds.high) {
      ctx.addIssue({
        code: "custom",

        path: ["thresholds", "medium"],

        message: "El límite medio debe ser menor que el límite alto.",
      });
    }
  });

/*
|--------------------------------------------------------------------------
| RECOMENDACIONES
|--------------------------------------------------------------------------
*/

export const recommendationSettingsSchema = z
  .object({
    healthyMinIri: z.coerce.number().min(0).max(100),

    redistributeMinCoverageDays: z.coerce.number().int().positive().max(3650),

    offerMinIri: z.coerce.number().min(0).max(100),

    liquidateMaxIri: z.coerce.number().min(0).max(100),
  })
  .superRefine((value, ctx) => {
    if (value.offerMinIri >= value.healthyMinIri) {
      ctx.addIssue({
        code: "custom",

        path: ["offerMinIri"],

        message:
          "El límite de Ofertar debe ser menor que el límite de Mantener.",
      });
    }

    /*
     * Evitamos huecos:
     *
     * < 40 Liquidar
     * >=40 y <65 Ofertar
     */
    if (value.offerMinIri !== value.liquidateMaxIri) {
      ctx.addIssue({
        code: "custom",

        path: ["liquidateMaxIri"],

        message:
          "El límite de Liquidar debe coincidir con el inicio de Ofertar.",
      });
    }
  });

/*
|--------------------------------------------------------------------------
| SEMÁFOROS
|--------------------------------------------------------------------------
*/

export const trafficLightSettingsSchema = z
  .object({
    coverage: z.object({
      healthyMaxDays: z.coerce.number().int().positive(),

      warningMaxDays: z.coerce.number().int().positive(),
    }),

    tracking: z.object({
      warningDays: z.coerce.number().int().min(1).max(90),

      criticalDays: z.coerce.number().int().min(1).max(90),
    }),

    recovery: z.object({
      high: z.coerce.number().min(0).max(100),

      medium: z.coerce.number().min(0).max(100),
    }),
  })
  .superRefine((value, ctx) => {
    if (value.coverage.healthyMaxDays >= value.coverage.warningMaxDays) {
      ctx.addIssue({
        code: "custom",

        path: ["coverage", "healthyMaxDays"],

        message:
          "La cobertura saludable debe ser menor que el nivel de advertencia.",
      });
    }

    if (value.tracking.criticalDays > value.tracking.warningDays) {
      ctx.addIssue({
        code: "custom",

        path: ["tracking", "criticalDays"],

        message: "Los días críticos no pueden superar los días de advertencia.",
      });
    }

    if (value.recovery.medium >= value.recovery.high) {
      ctx.addIssue({
        code: "custom",

        path: ["recovery", "medium"],

        message: "El nivel medio debe ser menor que el nivel alto.",
      });
    }
  });

/*
|--------------------------------------------------------------------------
| NOTIFICACIONES
|--------------------------------------------------------------------------
*/

export const notificationSettingsSchema = z.object({
  trackingDueEnabled: z.boolean(),

  trackingDueDays: z.coerce.number().int().min(1).max(90),

  trackingOverdueEnabled: z.boolean(),

  recoveryPendingEnabled: z.boolean(),

  recoveryPendingDays: z.coerce.number().int().min(1).max(180),
});

/*
|--------------------------------------------------------------------------
| INPUTS ACTIONS
|--------------------------------------------------------------------------
*/

export const updateIriSettingsSchema = z.object({
  companyId: z.string().uuid(),

  config: iriSettingsSchema,
});

export const updateRecommendationSettingsSchema = z.object({
  companyId: z.string().uuid(),

  config: recommendationSettingsSchema,
});

export const updateTrafficLightSettingsSchema = z.object({
  companyId: z.string().uuid(),

  config: trafficLightSettingsSchema,
});

export const updateNotificationSettingsSchema = z.object({
  companyId: z.string().uuid(),

  config: notificationSettingsSchema,
});
