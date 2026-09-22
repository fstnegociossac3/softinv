export type IriClassification = "high" | "medium" | "low";

export type IriVariableScores = {
  demand: number;

  recency: number;

  coverage: number;

  trend: number;
};

export type IriInventoryInput = {
  id: string;

  companyId: string;

  sku: string;

  description: string;

  category: string | null;

  brand: string | null;

  location: string | null;

  stockQuantity: number;

  unitCost: number;

  lastMovementDate: Date | null;

  sales30d: number;

  sales90d: number;

  sales180d: number;

  capturedAt: Date;
};

export type IriItemResult = IriInventoryInput & {
  /*
   * Un SKU con stock 0
   * no forma parte del inventario
   * recuperable.
   */
  eligible: boolean;

  stockValue: number;

  /*
   * Ventas estimadas dentro
   * del periodo seleccionado.
   */
  estimatedPeriodSales: number;

  estimatedMonthlyDemand: number;

  /*
   * Días aproximados necesarios
   * para consumir el stock.
   */
  coverageDays: number | null;

  /*
   * Velocidad reciente /
   * velocidad histórica.
   */
  trendRatio: number | null;

  scores: IriVariableScores;

  iri: number;

  classification: IriClassification;

  /*
   * Capital recuperable estimado.
   */
  opportunityValue: number;
};

export type IriDistributionBucket = {
  count: number;

  percentage: number;

  stockValue: number;

  stockValuePercentage: number;
};

export type IriDistribution = {
  high: IriDistributionBucket;

  medium: IriDistributionBucket;

  low: IriDistributionBucket;
};

export type IriSummary = {
  analyzedSkuCount: number;

  iriAverage: number;

  highRecoverabilitySkuCount: number;

  highRecoverabilityPercentage: number;

  highRecoverabilityStockValue: number;

  opportunityCount: number;

  opportunityValue: number;

  totalStockValue: number;
};

export type IriDashboardResult = {
  summary: IriSummary;

  distribution: IriDistribution;

  variableAverages: IriVariableScores;

  opportunities: Array<
    IriItemResult & {
      rank: number;
    }
  >;

  /*
   * Lo conservamos para el análisis
   * individual de SKU.
   */
  items: IriItemResult[];
};
