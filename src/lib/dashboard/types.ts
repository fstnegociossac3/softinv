import type { RecommendationAction } from "@/lib/recommendations/types";

/*
|--------------------------------------------------------------------------
| FILTROS
|--------------------------------------------------------------------------
*/

export type MainDashboardFilters = {
  /*
   * Admin:
   * empresa seleccionada.
   *
   * User:
   * se ignora y se utiliza auth.company.id.
   */
  companyId?: string;

  /*
   * YYYY-MM-DD
   *
   * Siguen las mismas reglas del IRI.
   */
  from?: string;

  /*
   * YYYY-MM-DD
   */
  to?: string;

  /*
   * Puntos de la tendencia.
   */
  trendMonths?: 3 | 6;
};

export type TrendMonthCount = 3 | 6;

/*
|--------------------------------------------------------------------------
| KPI
|--------------------------------------------------------------------------
*/

export type DashboardKpi = {
  current: number;

  previous: number;

  changePercentage: number | null;
};

/*
|--------------------------------------------------------------------------
| SEMÁFORO
|--------------------------------------------------------------------------
*/

export type TrafficLightKey = "green" | "yellow" | "orange" | "red";

export type TrafficLightDistributionEntry = {
  key: TrafficLightKey;

  label: string;

  recommendationAction: RecommendationAction;

  count: number;

  percentage: number;
};

/*
|--------------------------------------------------------------------------
| TENDENCIA
|--------------------------------------------------------------------------
*/

export type RotationTrendPoint = {
  /*
   * Etiqueta legible.
   */
  month: string;

  /*
   * YYYY-MM
   */
  monthKey: string;

  maintain: number;

  redistribute: number;

  offer: number;

  liquidate: number;

  iriAverage: number;
};

/*
|--------------------------------------------------------------------------
| SKU PRIORITARIO
|--------------------------------------------------------------------------
*/

export type PrioritySku = {
  inventoryItemId: string;

  sku: string;

  description: string;

  category: string | null;

  brand: string | null;

  daysWithoutMovement: number | null;

  iri: number;

  recommendationAction: RecommendationAction;

  recommendationLabel: string;

  status: TrafficLightKey;

  statusLabel: string;

  stockQuantity: number;

  stockValue: number;
};

/*
|--------------------------------------------------------------------------
| RESULTADO
|--------------------------------------------------------------------------
*/

export type MainDashboardResult = {
  filters: {
    companyId: string;

    companyName: string;

    from: string;

    to: string;

    previousFrom: string;

    previousTo: string;

    trendMonths: TrendMonthCount;
  };

  kpis: {
    skuAnalyzed: DashboardKpi;

    immobilizedCapital: DashboardKpi;

    criticalSku: DashboardKpi;

    recoverableCapital: DashboardKpi;

    recoveredCapital: DashboardKpi;
  };

  trafficLightDistribution: TrafficLightDistributionEntry[];

  rotationTrend: RotationTrendPoint[];

  prioritySkus: PrioritySku[];
};