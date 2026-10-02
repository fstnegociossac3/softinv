export const REPORT_LIMITS = {
  /*
   * Historial:
   * exactamente 5 por página.
   */
  PAGE_SIZE: 5,

  /*
   * IRI y Recomendaciones
   * actualmente trabajan con
   * un máximo de 180 días.
   */
  MAX_PERIOD_DAYS: 180,

  SNAPSHOT_VERSION: 1,
} as const;

export const REPORT_TYPE_LABELS = {
  executive: "Reporte Ejecutivo",

  critical_inventory: "Inventario Crítico",

  recommendations: "Recomendaciones",

  recovery: "Recuperación",
} as const;

export type ReportType = keyof typeof REPORT_TYPE_LABELS;

export type ReportExportFormat = "pdf" | "excel";
