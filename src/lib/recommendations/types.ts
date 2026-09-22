import type { IriItemResult } from "@/lib/iri/types";

/*
|--------------------------------------------------------------------------
| ACCIONES
|--------------------------------------------------------------------------
*/

export type RecommendationAction =
  | "maintain"
  | "redistribute"
  | "offer"
  | "liquidate";

/*
|--------------------------------------------------------------------------
| RECOMENDACIÓN POR SKU
|--------------------------------------------------------------------------
*/

export type RecommendationItem = IriItemResult & {
  /*
   * Acción sugerida.
   */
  action: RecommendationAction;

  actionLabel: string;

  /*
   * Explicación breve de
   * por qué se recomienda
   * esa acción.
   */
  reason: string;

  /*
   * Cantidad estimada que podría
   * rotar dentro del periodo
   * seleccionado según la demanda.
   */
  potentialRotationUnits: number;

  /*
   * Valor económico de esas unidades.
   */
  potentialRotationValue: number;

  /*
   * Porcentaje del stock que
   * potencialmente podría rotar.
   */
  potentialRotationPercentage: number;
};

/*
|--------------------------------------------------------------------------
| RESUMEN POR ACCIÓN
|--------------------------------------------------------------------------
*/

export type RecommendationActionBucket = {
  count: number;

  percentage: number;

  stockValue: number;

  stockValuePercentage: number;
};

export type RecommendationDistribution = {
  maintain: RecommendationActionBucket;

  redistribute: RecommendationActionBucket;

  offer: RecommendationActionBucket;

  liquidate: RecommendationActionBucket;
};

/*
|--------------------------------------------------------------------------
| KPI
|--------------------------------------------------------------------------
*/

export type RecommendationSummary = {
  /*
   * Incluye:
   *
   * mantener
   * redistribuir
   * ofertar
   * liquidar
   */
  totalRecommendations: number;

  /*
   * Capital que necesita intervención.
   *
   * NO incluye Mantener.
   */
  capitalInvolved: number;

  /*
   * Valor del capital que,
   * según demanda observada,
   * podría rotar dentro
   * del periodo.
   */
  potentialRotationValue: number;

  /*
   * potencialRotationValue
   * ----------------------
   * capitalInvolved
   */
  potentialRotationPercentage: number;

  /*
   * Valor total del inventario
   * incluido en el análisis.
   */
  totalInventoryValue: number;
};

/*
|--------------------------------------------------------------------------
| RESULTADO COMPLETO
|--------------------------------------------------------------------------
*/

export type RecommendationsResult = {
  summary: RecommendationSummary;

  distribution: RecommendationDistribution;

  recommendations: RecommendationItem[];
};
