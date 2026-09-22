import { IRI_ANALYSIS, IRI_THRESHOLDS, IRI_WEIGHTS } from "@/config/iri";

import type {
  IriClassification,
  IriDashboardResult,
  IriDistribution,
  IriInventoryInput,
  IriItemResult,
  IriVariableScores,
} from "@/lib/iri/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/*
|--------------------------------------------------------------------------
| UTILIDADES
|--------------------------------------------------------------------------
*/

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;

  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function safeNumber(value: number) {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function interpolate(
  value: number,

  fromX: number,

  toX: number,

  fromY: number,

  toY: number,
) {
  if (fromX === toX) {
    return fromY;
  }

  const ratio = clamp((value - fromX) / (toX - fromX), 0, 1);

  return fromY + (toY - fromY) * ratio;
}

/*
|--------------------------------------------------------------------------
| PERCENTIL
|--------------------------------------------------------------------------
|
| Se utiliza para normalizar la demanda
| dentro del inventario de la empresa.
|
*/

export function percentile(
  values: number[],

  percentileValue: number,
) {
  const cleanValues = values
    .filter((value) => Number.isFinite(value))
    .map((value) => Math.max(value, 0))
    .sort((a, b) => a - b);

  if (!cleanValues.length) {
    return 0;
  }

  if (cleanValues.length === 1) {
    return cleanValues[0];
  }

  const p = clamp(percentileValue, 0, 1);

  const position = (cleanValues.length - 1) * p;

  const lowerIndex = Math.floor(position);

  const upperIndex = Math.ceil(position);

  if (lowerIndex === upperIndex) {
    return cleanValues[lowerIndex];
  }

  const fraction = position - lowerIndex;

  return (
    cleanValues[lowerIndex] +
    (cleanValues[upperIndex] - cleanValues[lowerIndex]) * fraction
  );
}

/*
|--------------------------------------------------------------------------
| VENTAS ESTIMADAS DEL PERIODO
|--------------------------------------------------------------------------
|
| Nuestro sistema almacena:
|
| sales30d
| sales90d
| sales180d
|
| Si el usuario solicita 60 días:
|
| ventas30
| +
| proporción de los 60 días anteriores.
|
*/

export function estimatePeriodSales(
  sales30d: number,

  sales90d: number,

  sales180d: number,

  periodDays: number,
) {
  const days = clamp(
    Math.round(periodDays),

    IRI_ANALYSIS.MIN_DAYS,

    IRI_ANALYSIS.MAX_DAYS,
  );

  const sales30 = safeNumber(sales30d);

  /*
   * Protección ante datos
   * inconsistentes.
   */
  const sales90 = Math.max(
    safeNumber(sales90d),

    sales30,
  );

  const sales180 = Math.max(
    safeNumber(sales180d),

    sales90,
  );

  /*
   * 1 - 30 días
   */
  if (days <= 30) {
    return round(
      (sales30 / 30) * days,

      4,
    );
  }

  /*
   * 31 - 90 días
   */
  if (days <= 90) {
    const previous60Sales = Math.max(
      sales90 - sales30,

      0,
    );

    return round(
      sales30 + (previous60Sales / 60) * (days - 30),

      4,
    );
  }

  /*
   * 91 - 180 días
   */
  const previous90Sales = Math.max(
    sales180 - sales90,

    0,
  );

  return round(
    sales90 + (previous90Sales / 90) * (days - 90),

    4,
  );
}

/*
|--------------------------------------------------------------------------
| RECENCIA
|--------------------------------------------------------------------------
*/

export function calculateRecencyScore(
  lastMovementDate: Date | null,

  referenceDate: Date,
) {
  if (!lastMovementDate) {
    return 0;
  }

  const daysSinceMovement = Math.max(
    0,

    Math.floor((referenceDate.getTime() - lastMovementDate.getTime()) / DAY_MS),
  );

  if (daysSinceMovement <= 7) {
    return 100;
  }

  if (daysSinceMovement <= 30) {
    return round(
      interpolate(
        daysSinceMovement,

        7,
        30,

        100,
        85,
      ),
    );
  }

  if (daysSinceMovement <= 60) {
    return round(
      interpolate(
        daysSinceMovement,

        30,
        60,

        85,
        65,
      ),
    );
  }

  if (daysSinceMovement <= 90) {
    return round(
      interpolate(
        daysSinceMovement,

        60,
        90,

        65,
        45,
      ),
    );
  }

  if (daysSinceMovement <= 180) {
    return round(
      interpolate(
        daysSinceMovement,

        90,
        180,

        45,
        15,
      ),
    );
  }

  if (daysSinceMovement <= 365) {
    return round(
      interpolate(
        daysSinceMovement,

        180,
        365,

        15,
        0,
      ),
    );
  }

  return 0;
}

/*
|--------------------------------------------------------------------------
| COBERTURA
|--------------------------------------------------------------------------
|
| Cuántos días de inventario tenemos
| según la demanda estimada.
|
| Menor cobertura = mayor posibilidad
| de recuperación.
|
*/

export function calculateCoverageScore(coverageDays: number | null) {
  if (coverageDays === null || !Number.isFinite(coverageDays)) {
    return 0;
  }

  if (coverageDays <= 30) {
    return 100;
  }

  if (coverageDays <= 60) {
    return round(
      interpolate(
        coverageDays,

        30,
        60,

        100,
        85,
      ),
    );
  }

  if (coverageDays <= 90) {
    return round(
      interpolate(
        coverageDays,

        60,
        90,

        85,
        70,
      ),
    );
  }

  if (coverageDays <= 120) {
    return round(
      interpolate(
        coverageDays,

        90,
        120,

        70,
        55,
      ),
    );
  }

  if (coverageDays <= 180) {
    return round(
      interpolate(
        coverageDays,

        120,
        180,

        55,
        35,
      ),
    );
  }

  if (coverageDays <= 365) {
    return round(
      interpolate(
        coverageDays,

        180,
        365,

        35,
        10,
      ),
    );
  }

  if (coverageDays <= 730) {
    return round(
      interpolate(
        coverageDays,

        365,
        730,

        10,
        0,
      ),
    );
  }

  return 0;
}

/*
|--------------------------------------------------------------------------
| TENDENCIA
|--------------------------------------------------------------------------
|
| Comparamos:
|
| últimos 30 días
|
| contra
|
| comportamiento anterior
|
*/

export function calculateTrend(
  sales30d: number,

  sales90d: number,

  sales180d: number,
) {
  const sales30 = safeNumber(sales30d);

  const sales90 = Math.max(
    safeNumber(sales90d),

    sales30,
  );

  const sales180 = Math.max(
    safeNumber(sales180d),

    sales90,
  );

  /*
   * Últimos 30 días.
   */
  const recentDailyRate = sales30 / 30;

  /*
   * Días 31 - 90.
   */
  const previous60DailyRate =
    Math.max(
      sales90 - sales30,

      0,
    ) / 60;

  /*
   * Días 91 - 180.
   */
  const older90DailyRate =
    Math.max(
      sales180 - sales90,

      0,
    ) / 90;

  /*
   * Damos mayor peso al
   * periodo histórico más reciente.
   */
  const baselineDailyRate =
    previous60DailyRate * 0.65 + older90DailyRate * 0.35;

  /*
   * Sin ventas.
   */
  if (recentDailyRate === 0 && baselineDailyRate === 0) {
    return {
      ratio: null,

      score: 0,
    };
  }

  /*
   * Producto que comenzó
   * a vender recientemente.
   */
  if (baselineDailyRate === 0) {
    return {
      ratio: null,

      score: recentDailyRate > 0 ? 100 : 0,
    };
  }

  const ratio = recentDailyRate / baselineDailyRate;

  let score: number;

  if (ratio <= 0.25) {
    score = interpolate(
      ratio,

      0,
      0.25,

      0,
      10,
    );
  } else if (ratio <= 0.5) {
    score = interpolate(
      ratio,

      0.25,
      0.5,

      10,
      25,
    );
  } else if (ratio <= 0.8) {
    score = interpolate(
      ratio,

      0.5,
      0.8,

      25,
      55,
    );
  } else if (ratio <= 1) {
    score = interpolate(
      ratio,

      0.8,
      1,

      55,
      72,
    );
  } else if (ratio <= 1.2) {
    score = interpolate(
      ratio,

      1,
      1.2,

      72,
      84,
    );
  } else if (ratio <= 1.5) {
    score = interpolate(
      ratio,

      1.2,
      1.5,

      84,
      94,
    );
  } else {
    score = interpolate(
      Math.min(ratio, 2),

      1.5,
      2,

      94,
      100,
    );
  }

  return {
    ratio: round(ratio, 4),

    score: round(clamp(score)),
  };
}

/*
|--------------------------------------------------------------------------
| DEMANDA
|--------------------------------------------------------------------------
*/

export function calculateDemandScore(
  estimatedMonthlyDemand: number,

  demandReference: number,
) {
  if (estimatedMonthlyDemand <= 0 || demandReference <= 0) {
    return 0;
  }

  return round(clamp((estimatedMonthlyDemand / demandReference) * 100));
}

/*
|--------------------------------------------------------------------------
| CLASIFICACIÓN
|--------------------------------------------------------------------------
*/

export function classifyIri(iri: number): IriClassification {
  if (iri >= IRI_THRESHOLDS.high) {
    return "high";
  }

  if (iri >= IRI_THRESHOLDS.medium) {
    return "medium";
  }

  return "low";
}

/*
|--------------------------------------------------------------------------
| PROMEDIO VARIABLES
|--------------------------------------------------------------------------
*/

function calculateVariableAverages(items: IriItemResult[]): IriVariableScores {
  if (!items.length) {
    return {
      demand: 0,

      recency: 0,

      coverage: 0,

      trend: 0,
    };
  }

  const totals = items.reduce(
    (accumulator, item) => {
      accumulator.demand += item.scores.demand;

      accumulator.recency += item.scores.recency;

      accumulator.coverage += item.scores.coverage;

      accumulator.trend += item.scores.trend;

      return accumulator;
    },

    {
      demand: 0,

      recency: 0,

      coverage: 0,

      trend: 0,
    },
  );

  return {
    demand: round(totals.demand / items.length),

    recency: round(totals.recency / items.length),

    coverage: round(totals.coverage / items.length),

    trend: round(totals.trend / items.length),
  };
}

/*
|--------------------------------------------------------------------------
| DISTRIBUCIÓN
|--------------------------------------------------------------------------
*/

function calculateDistribution(items: IriItemResult[]): IriDistribution {
  const totalCount = items.length;

  const totalStockValue = items.reduce(
    (sum, item) => sum + item.stockValue,

    0,
  );

  function bucket(classification: IriClassification) {
    const bucketItems = items.filter(
      (item) => item.classification === classification,
    );

    const stockValue = bucketItems.reduce(
      (sum, item) => sum + item.stockValue,

      0,
    );

    return {
      count: bucketItems.length,

      percentage: totalCount
        ? round((bucketItems.length / totalCount) * 100)
        : 0,

      stockValue: round(stockValue, 2),

      stockValuePercentage: totalStockValue
        ? round((stockValue / totalStockValue) * 100)
        : 0,
    };
  }

  return {
    high: bucket("high"),

    medium: bucket("medium"),

    low: bucket("low"),
  };
}

/*
|--------------------------------------------------------------------------
| DASHBOARD IRI
|--------------------------------------------------------------------------
*/

export function calculateIriDashboard(
  inputs: IriInventoryInput[],

  options: {
    referenceDate: Date;

    periodDays: number;

    opportunityLimit?: number;
  },
): IriDashboardResult {
  const periodDays = clamp(
    Math.round(options.periodDays),

    IRI_ANALYSIS.MIN_DAYS,

    IRI_ANALYSIS.MAX_DAYS,
  );

  /*
   * Primero calculamos demanda.
   */
  const prepared = inputs.map((item) => {
    const estimatedPeriodSales = estimatePeriodSales(
      item.sales30d,

      item.sales90d,

      item.sales180d,

      periodDays,
    );

    const estimatedMonthlyDemand = periodDays
      ? (estimatedPeriodSales / periodDays) * 30
      : 0;

    return {
      item,

      estimatedPeriodSales,

      estimatedMonthlyDemand,
    };
  });

  /*
   * Percentil 90.
   *
   * Esto permite comparar demanda
   * entre SKU de la misma empresa.
   */
  const demandReference = percentile(
    prepared
      .filter(({ item }) => item.stockQuantity > 0)
      .map(({ estimatedMonthlyDemand }) => estimatedMonthlyDemand),

    IRI_ANALYSIS.DEMAND_REFERENCE_PERCENTILE,
  );

  /*
   * Calculamos cada SKU.
   */
  const items: IriItemResult[] = prepared.map(
    ({
      item,

      estimatedPeriodSales,

      estimatedMonthlyDemand,
    }) => {
      /*
       * Stock 0:
       *
       * no existe inventario
       * que recuperar.
       */
      const eligible = item.stockQuantity > 0;

      const stockValue = round(
        item.stockQuantity * item.unitCost,

        2,
      );

      const dailyDemand = periodDays ? estimatedPeriodSales / periodDays : 0;

      const coverageDays =
        eligible && dailyDemand > 0
          ? round(
              item.stockQuantity / dailyDemand,

              2,
            )
          : null;

      const trend = calculateTrend(
        item.sales30d,

        item.sales90d,

        item.sales180d,
      );

      const scores: IriVariableScores = eligible
        ? {
            demand: calculateDemandScore(
              estimatedMonthlyDemand,

              demandReference,
            ),

            recency: calculateRecencyScore(
              item.lastMovementDate,

              options.referenceDate,
            ),

            coverage: calculateCoverageScore(coverageDays),

            trend: trend.score,
          }
        : {
            demand: 0,

            recency: 0,

            coverage: 0,

            trend: 0,
          };

      /*
       * Fórmula IRI.
       */
      const iri = eligible
        ? round(
            scores.demand * IRI_WEIGHTS.demand +
              scores.recency * IRI_WEIGHTS.recency +
              scores.coverage * IRI_WEIGHTS.coverage +
              scores.trend * IRI_WEIGHTS.trend,
          )
        : 0;

      return {
        ...item,

        eligible,

        stockValue,

        estimatedPeriodSales: round(
          estimatedPeriodSales,

          4,
        ),

        estimatedMonthlyDemand: round(
          estimatedMonthlyDemand,

          4,
        ),

        coverageDays,

        trendRatio: trend.ratio,

        scores,

        iri,

        classification: classifyIri(iri),

        /*
         * Valor recuperable
         * estimado.
         */
        opportunityValue: round(
          stockValue * (iri / 100),

          2,
        ),
      };
    },
  );

  /*
   * Solo inventario con stock.
   */
  const eligibleItems = items.filter((item) => item.eligible);

  const totalStockValue = eligibleItems.reduce(
    (sum, item) => sum + item.stockValue,

    0,
  );

  /*
   * IRI promedio.
   */
  const iriAverage = eligibleItems.length
    ? eligibleItems.reduce(
        (sum, item) => sum + item.iri,

        0,
      ) / eligibleItems.length
    : 0;

  /*
   * Alta recuperabilidad.
   */
  const highItems = eligibleItems.filter(
    (item) => item.classification === "high",
  );

  /*
   * Oportunidades.
   */
  const opportunityItems = eligibleItems
    .filter((item) => item.iri >= IRI_ANALYSIS.OPPORTUNITY_MIN_IRI)
    .sort((a, b) => {
      if (b.opportunityValue !== a.opportunityValue) {
        return b.opportunityValue - a.opportunityValue;
      }

      return b.iri - a.iri;
    });

  const opportunityLimit = clamp(
    Math.round(
      options.opportunityLimit ?? IRI_ANALYSIS.DEFAULT_OPPORTUNITY_LIMIT,
    ),

    1,

    IRI_ANALYSIS.MAX_OPPORTUNITY_LIMIT,
  );

  return {
    /*
    |--------------------------------------------------------------------------
    | KPI
    |--------------------------------------------------------------------------
    */

    summary: {
      analyzedSkuCount: eligibleItems.length,

      iriAverage: round(iriAverage),

      highRecoverabilitySkuCount: highItems.length,

      highRecoverabilityPercentage: eligibleItems.length
        ? round((highItems.length / eligibleItems.length) * 100)
        : 0,

      highRecoverabilityStockValue: round(
        highItems.reduce(
          (sum, item) => sum + item.stockValue,

          0,
        ),

        2,
      ),

      opportunityCount: opportunityItems.length,

      opportunityValue: round(
        opportunityItems.reduce(
          (sum, item) => sum + item.opportunityValue,

          0,
        ),

        2,
      ),

      totalStockValue: round(
        totalStockValue,

        2,
      ),
    },

    /*
    |--------------------------------------------------------------------------
    | DISTRIBUCIÓN
    |--------------------------------------------------------------------------
    */

    distribution: calculateDistribution(eligibleItems),

    /*
    |--------------------------------------------------------------------------
    | VARIABLES PROMEDIO
    |--------------------------------------------------------------------------
    */

    variableAverages: calculateVariableAverages(eligibleItems),

    /*
    |--------------------------------------------------------------------------
    | OPORTUNIDADES
    |--------------------------------------------------------------------------
    */

    opportunities: opportunityItems
      .slice(0, opportunityLimit)
      .map((item, index) => ({
        ...item,

        rank: index + 1,
      })),

    /*
     * Se utilizará después
     * para SKU seleccionado.
     */
    items,
  };
}
