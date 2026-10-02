export type IriSettingsConfig = {
  weights: {
    demand: number;
    recency: number;
    coverage: number;
    trend: number;
  };

  thresholds: {
    high: number;
    medium: number;
  };

  defaultDays: number;

  opportunityMinIri: number;

  demandReferencePercentile: number;
};

export type RecommendationSettingsConfig = {
  healthyMinIri: number;

  redistributeMinCoverageDays: number;

  offerMinIri: number;

  liquidateMaxIri: number;
};

export type TrafficLightSettingsConfig = {
  coverage: {
    healthyMaxDays: number;
    warningMaxDays: number;
  };

  tracking: {
    warningDays: number;
    criticalDays: number;
  };

  recovery: {
    high: number;
    medium: number;
  };
};

export type NotificationSettingsConfig = {
  trackingDueEnabled: boolean;

  trackingDueDays: number;

  trackingOverdueEnabled: boolean;

  recoveryPendingEnabled: boolean;

  recoveryPendingDays: number;
};

export type ResolvedCompanySettings = {
  iri: IriSettingsConfig;

  recommendations: RecommendationSettingsConfig;

  trafficLights: TrafficLightSettingsConfig;

  notifications: NotificationSettingsConfig;
};
