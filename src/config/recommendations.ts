/*
|--------------------------------------------------------------------------
| REGLAS DE RECOMENDACIONES
|--------------------------------------------------------------------------
|
| Las recomendaciones se calculan después del IRI.
|
| MANTENER
| IRI >= 65 y cobertura <= 90 días
|
| REDISTRIBUIR
| IRI >= 65 y cobertura > 90 días
|
| OFERTAR
| IRI >= 40 y < 65
|
| LIQUIDAR
| IRI < 40
|
*/

export const RECOMMENDATION_RULES = {
  /*
   * A partir de este IRI consideramos
   * que el producto todavía tiene
   * una recuperabilidad saludable.
   */
  HEALTHY_MIN_IRI: 65,

  /*
   * A partir de esta cobertura,
   * aun teniendo buen IRI,
   * consideramos que existe sobrestock.
   */
  REDISTRIBUTE_MIN_COVERAGE_DAYS: 90,

  /*
   * Recuperabilidad media.
   */
  OFFER_MIN_IRI: 40,

  /*
   * Por debajo de 40:
   * liquidar.
   */
  LIQUIDATE_MAX_IRI: 40,
} as const;

/*
|--------------------------------------------------------------------------
| PAGINACIÓN
|--------------------------------------------------------------------------
*/

export const RECOMMENDATION_PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,

  MAX_PAGE_SIZE: 100,
} as const;

/*
|--------------------------------------------------------------------------
| ETIQUETAS
|--------------------------------------------------------------------------
*/

export const RECOMMENDATION_ACTION_LABELS = {
  maintain: "Mantener",

  redistribute: "Redistribuir",

  offer: "Ofertar",

  liquidate: "Liquidar",
} as const;
