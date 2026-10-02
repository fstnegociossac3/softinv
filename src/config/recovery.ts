export const RECOVERY_LIMITS = {
  /*
   * Requisito:
   * 5 registros por página.
   */
  PAGE_SIZE: 5,

  /*
   * El motor IRI/Recomendaciones
   * actualmente trabaja hasta
   * 180 días.
   */
  MAX_ANALYSIS_DAYS: 180,
} as const;

export const RECOVERY_STATUS_LABELS = {
  pending: "Pendiente de resultado",

  in_progress: "En recuperación",

  recovered: "Recuperado",

  unrecovered: "Sin recuperación",
} as const;
