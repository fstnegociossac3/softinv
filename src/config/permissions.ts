export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard.view",
  ADMIN_DASHBOARD_VIEW: "admin.dashboard.view",

  // Empresas
  COMPANY_VIEW_OWN: "company.view.own",
  COMPANY_VIEW_ANY: "company.view.any",
  COMPANY_CREATE: "company.create",
  COMPANY_UPDATE: "company.update",
  COMPANY_CHANGE_STATUS: "company.change-status",

  // Usuarios
  USER_VIEW_ANY: "user.view.any",
  USER_CREATE: "user.create",
  USER_UPDATE: "user.update",
  USER_CHANGE_STATUS: "user.change-status",

  // Importaciones
  IMPORT_VIEW: "import.view",
  IMPORT_CREATE: "import.create",
  IMPORT_PROCESS: "import.process",

  // Inventario
  INVENTORY_VIEW: "inventory.view",
  INVENTORY_CREATE: "inventory.create",
  INVENTORY_UPDATE: "inventory.update",
  INVENTORY_EXPORT: "inventory.export",

  // Análisis
  ANALYSIS_VIEW: "analysis.view",
  ANALYSIS_RUN: "analysis.run",

  // IRI
  IRI_VIEW: "iri.view",
  IRI_CONFIGURE: "iri.configure",

  // Recomendaciones
  RECOMMENDATION_VIEW: "recommendation.view",
  RECOMMENDATION_MANAGE: "recommendation.manage",

  // Seguimiento
  TRACKING_VIEW: "tracking.view",
  TRACKING_MANAGE: "tracking.manage",

  // Recuperación
  RECOVERY_VIEW: "recovery.view",
  RECOVERY_CREATE: "recovery.create",
  RECOVERY_UPDATE: "recovery.update",

  // Reportes
  REPORT_VIEW: "report.view",
  REPORT_GENERATE: "report.generate",
  REPORT_EXPORT: "report.export",

  // Configuración
  TRAFFIC_LIGHT_CONFIGURE: "traffic-light.configure",
  NOTIFICATION_CONFIGURE: "notification.configure",

  SETTINGS_VIEW: "settings.view",

  // Auditoría
  AUDIT_VIEW: "audit.view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type AppRole = "admin" | "user";

const USER_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.DASHBOARD_VIEW,
  PERMISSIONS.COMPANY_VIEW_OWN,

  PERMISSIONS.IMPORT_VIEW,
  PERMISSIONS.IMPORT_CREATE,
  PERMISSIONS.IMPORT_PROCESS,

  PERMISSIONS.INVENTORY_VIEW,
  PERMISSIONS.INVENTORY_CREATE,
  PERMISSIONS.INVENTORY_UPDATE,
  PERMISSIONS.INVENTORY_EXPORT,

  PERMISSIONS.ANALYSIS_VIEW,
  PERMISSIONS.ANALYSIS_RUN,

  PERMISSIONS.IRI_VIEW,

  PERMISSIONS.RECOMMENDATION_VIEW,
  PERMISSIONS.RECOMMENDATION_MANAGE,

  PERMISSIONS.TRACKING_VIEW,
  PERMISSIONS.TRACKING_MANAGE,

  PERMISSIONS.RECOVERY_VIEW,
  PERMISSIONS.RECOVERY_CREATE,
  PERMISSIONS.RECOVERY_UPDATE,

  PERMISSIONS.REPORT_VIEW,
  PERMISSIONS.REPORT_GENERATE,
  PERMISSIONS.REPORT_EXPORT,
];

const ADMIN_PERMISSIONS: readonly Permission[] = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  admin: ADMIN_PERMISSIONS,
  user: USER_PERMISSIONS,
};
