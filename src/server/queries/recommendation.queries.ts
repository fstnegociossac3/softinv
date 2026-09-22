import "server-only";

import { PERMISSIONS } from "@/config/permissions";

import { RECOMMENDATION_PAGINATION } from "@/config/recommendations";

import { calculateRecommendations } from "@/lib/recommendations/calculate-recommendations";

import type {
  RecommendationAction,
  RecommendationItem,
} from "@/lib/recommendations/types";

import { getIriDashboard } from "@/server/queries/iri.queries";

import { requireAuth } from "@/server/services/auth.service";

import { requirePermission } from "@/server/services/authorization.service";

/*
|--------------------------------------------------------------------------
| ORDENAMIENTO
|--------------------------------------------------------------------------
*/

export type RecommendationSortField =
  | "sku"
  | "iri"
  | "stock"
  | "stockValue"
  | "coverage"
  | "potentialRotation";

export type RecommendationSortDirection = "asc" | "desc";

/*
|--------------------------------------------------------------------------
| FILTROS
|--------------------------------------------------------------------------
*/

export type RecommendationFilters = {
  /*
   * Admin:
   * empresa seleccionada.
   *
   * Usuario:
   * se ignora y se utiliza
   * auth.company.id desde IRI.
   */
  companyId?: string;

  /*
   * YYYY-MM-DD
   */
  from?: string;

  /*
   * YYYY-MM-DD
   */
  to?: string;

  /*
   * maintain
   * redistribute
   * offer
   * liquidate
   */
  action?: RecommendationAction;

  /*
   * SKU o descripción.
   */
  search?: string;

  sort?: RecommendationSortField;

  direction?: RecommendationSortDirection;

  page?: number;

  pageSize?: number;
};

/*
|--------------------------------------------------------------------------
| COMPARADOR
|--------------------------------------------------------------------------
*/

function compareRecommendations(
  a: RecommendationItem,

  b: RecommendationItem,

  sort: RecommendationSortField,
) {
  switch (sort) {
    case "sku":
      return a.sku.localeCompare(b.sku, "es");

    case "iri":
      return a.iri - b.iri;

    case "stock":
      return a.stockQuantity - b.stockQuantity;

    case "stockValue":
      return a.stockValue - b.stockValue;

    case "coverage": {
      /*
       * Sin cobertura:
       * lo consideramos infinito
       * para efectos de ordenamiento.
       */
      const aCoverage = a.coverageDays ?? Number.POSITIVE_INFINITY;

      const bCoverage = b.coverageDays ?? Number.POSITIVE_INFINITY;

      return aCoverage - bCoverage;
    }

    case "potentialRotation":
      return a.potentialRotationPercentage - b.potentialRotationPercentage;

    default:
      return 0;
  }
}

/*
|--------------------------------------------------------------------------
| DASHBOARD RECOMENDACIONES
|--------------------------------------------------------------------------
*/

export async function getRecommendationsDashboard(
  filters: RecommendationFilters = {},
) {
  /*
  |--------------------------------------------------------------------------
  | AUTORIZACIÓN
  |--------------------------------------------------------------------------
  */

  const auth = await requireAuth();

  requirePermission(
    auth,

    PERMISSIONS.RECOMMENDATION_VIEW,
  );

  /*
  |--------------------------------------------------------------------------
  | PAGINACIÓN
  |--------------------------------------------------------------------------
  */

  const page = Math.max(
    filters.page ?? 1,

    1,
  );

  const pageSize = Math.min(
    Math.max(
      filters.pageSize ?? RECOMMENDATION_PAGINATION.DEFAULT_PAGE_SIZE,

      1,
    ),

    RECOMMENDATION_PAGINATION.MAX_PAGE_SIZE,
  );

  const sort = filters.sort ?? "stockValue";

  const direction = filters.direction ?? "desc";

  /*
  |--------------------------------------------------------------------------
  | OBTENER IRI
  |--------------------------------------------------------------------------
  |
  | Reutilizamos completamente
  | el motor IRI.
  |
  | Esto significa que:
  |
  | - Usuario:
  |   solo utiliza su empresa.
  |
  | - Admin:
  |   utiliza companyId.
  |
  | - fechas:
  |   mismas reglas del IRI.
  |
  */

  const iriResult = await getIriDashboard({
    companyId: filters.companyId,

    from: filters.from,

    to: filters.to,
  });

  /*
  |--------------------------------------------------------------------------
  | CALCULAR RECOMENDACIONES
  |--------------------------------------------------------------------------
  */

  const calculated = calculateRecommendations(iriResult.dashboard.items);

  /*
  |--------------------------------------------------------------------------
  | FILTRAR
  |--------------------------------------------------------------------------
  */

  let recommendations = calculated.recommendations;

  /*
   * Acción.
   */
  if (filters.action) {
    recommendations = recommendations.filter(
      (item) => item.action === filters.action,
    );
  }

  /*
   * Buscar:
   *
   * SKU
   * descripción
   * categoría
   * marca
   * ubicación
   */
  const search = filters.search?.trim().toLocaleLowerCase("es");

  if (search) {
    recommendations = recommendations.filter((item) => {
      return [
        item.sku,

        item.description,

        item.category,

        item.brand,

        item.location,
      ].some((value) => value?.toLocaleLowerCase("es").includes(search));
    });
  }

  /*
  |--------------------------------------------------------------------------
  | ORDENAR
  |--------------------------------------------------------------------------
  */

  recommendations = [...recommendations].sort((a, b) => {
    const comparison = compareRecommendations(
      a,

      b,

      sort,
    );

    /*
     * Desempate por SKU.
     */
    if (comparison === 0) {
      return a.sku.localeCompare(b.sku, "es");
    }

    return direction === "asc" ? comparison : -comparison;
  });

  /*
  |--------------------------------------------------------------------------
  | PAGINAR
  |--------------------------------------------------------------------------
  */

  const total = recommendations.length;

  const totalPages = Math.max(
    Math.ceil(total / pageSize),

    1,
  );

  /*
   * Si llega page=100
   * pero solo existen 3 páginas,
   * usamos página 3.
   */
  const resolvedPage = Math.min(
    page,

    totalPages,
  );

  const offset = (resolvedPage - 1) * pageSize;

  const data = recommendations.slice(
    offset,

    offset + pageSize,
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

      periodDays: iriResult.filters.periodDays,

      action: filters.action ?? null,

      search: filters.search ?? null,

      sort,

      direction,
    },

    /*
    |--------------------------------------------------------------------------
    | KPI
    |--------------------------------------------------------------------------
    */

    summary: calculated.summary,

    /*
    |--------------------------------------------------------------------------
    | CONTADORES:
    |
    | Mantener
    | Redistribuir
    | Ofertar
    | Liquidar
    |--------------------------------------------------------------------------
    */

    distribution: calculated.distribution,

    /*
    |--------------------------------------------------------------------------
    | TABLA
    |--------------------------------------------------------------------------
    */

    recommendations: {
      data,

      total,

      page: resolvedPage,

      pageSize,

      totalPages,
    },
  };
}
