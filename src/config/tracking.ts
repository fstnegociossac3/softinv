export const TRACKING_LIMITS = {
  /*
   * Requisito del módulo:
   *
   * solamente 5 registros
   * por página.
   */
  PAGE_SIZE: 5,

  /*
   * Actividades visibles
   * en el dashboard.
   */
  RECENT_ACTIVITIES: 8,

  /*
   * Acciones vencidas
   * destacadas.
   */
  OVERDUE_ACTIONS: 5,
} as const;

export const TRACKING_STATUS_LABELS = {
  pending: "Pendiente",

  executed: "Ejecutada",

  overdue: "Vencida",
} as const;

export type TrackingDisplayStatus = keyof typeof TRACKING_STATUS_LABELS;
