export const IRI_WEIGHTS = {
  demand: 0.35,

  recency: 0.25,

  coverage: 0.25,

  trend: 0.15,
} as const;

/*
|--------------------------------------------------------------------------
| CLASIFICACIÓN
|--------------------------------------------------------------------------
|
| 75 - 100 = Alta
| 50 - 74  = Media
| 0  - 49  = Baja
|
*/

export const IRI_THRESHOLDS = {
  high: 75,

  medium: 50,
} as const;

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN DEL ANÁLISIS
|--------------------------------------------------------------------------
*/

export const IRI_ANALYSIS = {
  /*
   * Periodo inicial del dashboard.
   */
  DEFAULT_DAYS: 90,

  MIN_DAYS: 1,

  /*
   * Actualmente guardamos:
   *
   * sales_30d
   * sales_90d
   * sales_180d
   *
   * Por eso limitamos el análisis
   * a un máximo de 180 días.
   */
  MAX_DAYS: 180,

  /*
   * Un SKU con IRI >= 50
   * será considerado oportunidad.
   */
  OPPORTUNITY_MIN_IRI: 50,

  DEFAULT_OPPORTUNITY_LIMIT: 10,

  MAX_OPPORTUNITY_LIMIT: 50,

  /*
   * La demanda se normaliza utilizando
   * el percentil 90 del inventario.
   */
  DEMAND_REFERENCE_PERCENTILE: 0.9,
} as const;
