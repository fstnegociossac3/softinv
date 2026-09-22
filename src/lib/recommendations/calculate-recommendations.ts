import {
  RECOMMENDATION_ACTION_LABELS,
  RECOMMENDATION_RULES,
} from "@/config/recommendations";

import type { IriItemResult } from "@/lib/iri/types";

import type {
  RecommendationAction,
  RecommendationDistribution,
  RecommendationItem,
  RecommendationSummary,
  RecommendationsResult,
} from "@/lib/recommendations/types";

/*
|--------------------------------------------------------------------------
| UTILIDADES
|--------------------------------------------------------------------------
*/

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;

  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

/*
|--------------------------------------------------------------------------
| CLASIFICAR ACCIÓN
|--------------------------------------------------------------------------
*/

export function classifyRecommendation(
  item: IriItemResult,
): RecommendationAction {
  /*
   * Inventario con muy baja
   * recuperabilidad.
   */
  if (item.iri < RECOMMENDATION_RULES.LIQUIDATE_MAX_IRI) {
    return "liquidate";
  }

  /*
   * Recuperabilidad media.
   *
   * Todavía tiene posibilidades
   * comerciales, pero requiere
   * estímulo.
   */
  if (item.iri < RECOMMENDATION_RULES.HEALTHY_MIN_IRI) {
    return "offer";
  }

  /*
   * Buen IRI pero demasiados
   * días de cobertura.
   *
   * Significa que el producto
   * tiene demanda, pero existe
   * exceso de stock.
   */
  if (
    item.coverageDays !== null &&
    item.coverageDays > RECOMMENDATION_RULES.REDISTRIBUTE_MIN_COVERAGE_DAYS
  ) {
    return "redistribute";
  }

  /*
   * Inventario saludable.
   */
  return "maintain";
}

/*
|--------------------------------------------------------------------------
| TENDENCIA EN TEXTO
|--------------------------------------------------------------------------
*/

function getTrendDescription(trendRatio: number | null) {
  if (trendRatio === null) {
    return "sin histórico suficiente de tendencia";
  }

  if (trendRatio >= 1.1) {
    return "tendencia creciente";
  }

  if (trendRatio <= 0.9) {
    return "tendencia decreciente";
  }

  return "tendencia estable";
}

/*
|--------------------------------------------------------------------------
| MOTIVO
|--------------------------------------------------------------------------
*/

function buildReason(
  item: IriItemResult,

  action: RecommendationAction,
) {
  const coverage =
    item.coverageDays !== null
      ? `${round(item.coverageDays, 0)} días de cobertura`
      : "sin cobertura estimable";

  const trend = getTrendDescription(item.trendRatio);

  switch (action) {
    case "maintain":
      return (
        `IRI ${item.iri}/100, ` +
        `${coverage} y ${trend}. ` +
        "El nivel actual de inventario es compatible con la demanda observada."
      );

    case "redistribute":
      return (
        `IRI ${item.iri}/100 con ${coverage}. ` +
        "Existe recuperabilidad, pero el nivel de stock es elevado frente a la demanda actual; conviene evaluar redistribución."
      );

    case "offer":
      return (
        `IRI ${item.iri}/100, ${coverage} y ${trend}. ` +
        "La recuperabilidad es media y puede requerir una acción comercial para acelerar la salida."
      );

    case "liquidate":
      return (
        `IRI ${item.iri}/100, ${coverage} y ${trend}. ` +
        "La recuperación mediante la rotación normal es baja; conviene priorizar una salida acelerada."
      );
  }
}

/*
|--------------------------------------------------------------------------
| ROTACIÓN POTENCIAL POR SKU
|--------------------------------------------------------------------------
|
| Ejemplo:
|
| Stock                  = 100
| Ventas estimadas       = 35
|
| Rotación potencial:
|
| min(100, 35)
| ------------ × 100
|      100
|
| = 35 %
|
*/

function calculatePotentialRotation(item: IriItemResult) {
  if (item.stockQuantity <= 0) {
    return {
      units: 0,

      value: 0,

      percentage: 0,
    };
  }

  const units = Math.min(
    item.stockQuantity,

    Math.max(item.estimatedPeriodSales, 0),
  );

  const value = units * item.unitCost;

  const percentage = (units / item.stockQuantity) * 100;

  return {
    units: round(units, 4),

    value: round(value, 2),

    percentage: round(clamp(percentage)),
  };
}

/*
|--------------------------------------------------------------------------
| CREAR RECOMENDACIÓN SKU
|--------------------------------------------------------------------------
*/

export function calculateRecommendationForItem(
  item: IriItemResult,
): RecommendationItem {
  const action = classifyRecommendation(item);

  const rotation = calculatePotentialRotation(item);

  return {
    ...item,

    action,

    actionLabel: RECOMMENDATION_ACTION_LABELS[action],

    reason: buildReason(item, action),

    potentialRotationUnits: rotation.units,

    potentialRotationValue: rotation.value,

    potentialRotationPercentage: rotation.percentage,
  };
}

/*
|--------------------------------------------------------------------------
| DISTRIBUCIÓN
|--------------------------------------------------------------------------
*/

function calculateDistribution(
  recommendations: RecommendationItem[],
): RecommendationDistribution {
  const total = recommendations.length;

  const totalStockValue = recommendations.reduce(
    (sum, item) => sum + item.stockValue,

    0,
  );

  function bucket(action: RecommendationAction) {
    const items = recommendations.filter((item) => item.action === action);

    const stockValue = items.reduce(
      (sum, item) => sum + item.stockValue,

      0,
    );

    return {
      count: items.length,

      percentage: total ? round((items.length / total) * 100) : 0,

      stockValue: round(stockValue, 2),

      stockValuePercentage: totalStockValue
        ? round((stockValue / totalStockValue) * 100)
        : 0,
    };
  }

  return {
    maintain: bucket("maintain"),

    redistribute: bucket("redistribute"),

    offer: bucket("offer"),

    liquidate: bucket("liquidate"),
  };
}

/*
|--------------------------------------------------------------------------
| RESUMEN
|--------------------------------------------------------------------------
*/

function calculateSummary(
  recommendations: RecommendationItem[],
): RecommendationSummary {
  const totalInventoryValue = recommendations.reduce(
    (sum, item) => sum + item.stockValue,

    0,
  );

  /*
   * Capital involucrado:
   *
   * solamente productos
   * que necesitan intervención.
   *
   * Mantener queda fuera.
   */
  const actionable = recommendations.filter(
    (item) => item.action !== "maintain",
  );

  const capitalInvolved = actionable.reduce(
    (sum, item) => sum + item.stockValue,

    0,
  );

  /*
   * Capital que podría rotar
   * según la demanda observada.
   */
  const potentialRotationValue = actionable.reduce(
    (sum, item) => sum + item.potentialRotationValue,

    0,
  );

  const potentialRotationPercentage =
    capitalInvolved > 0 ? (potentialRotationValue / capitalInvolved) * 100 : 0;

  return {
    totalRecommendations: recommendations.length,

    capitalInvolved: round(capitalInvolved, 2),

    potentialRotationValue: round(potentialRotationValue, 2),

    potentialRotationPercentage: round(clamp(potentialRotationPercentage)),

    totalInventoryValue: round(totalInventoryValue, 2),
  };
}

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

export function calculateRecommendations(
  iriItems: IriItemResult[],
): RecommendationsResult {
  /*
   * Solo analizamos SKU
   * que realmente tienen stock.
   */
  const recommendations = iriItems
    .filter((item) => item.eligible && item.stockQuantity > 0)
    .map((item) => calculateRecommendationForItem(item));

  return {
    summary: calculateSummary(recommendations),

    distribution: calculateDistribution(recommendations),

    recommendations,
  };
}
