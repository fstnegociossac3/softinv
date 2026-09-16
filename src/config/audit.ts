export const AUDIT_MODULES = {
  AUTH: "auth",
  COMPANIES: "companies",
  USERS: "users",
  IMPORTS: "imports",
  INVENTORY: "inventory",
  ANALYSIS: "analysis",
  IRI: "iri",
  RECOMMENDATIONS: "recommendations",
  TRACKING: "tracking",
  RECOVERY: "recovery",
  REPORTS: "reports",
  SETTINGS: "settings",
} as const;

export const AUDIT_ACTIONS = {
  LOGIN: "login",
  LOGOUT: "logout",

  CREATE: "create",
  UPDATE: "update",

  ACTIVATE: "activate",
  DEACTIVATE: "deactivate",

  IMPORT: "import",
  PROCESS: "process",

  ANALYZE: "analyze",

  GENERATE: "generate",

  ACCEPT: "accept",
  REJECT: "reject",

  EXECUTE: "execute",

  REGISTER: "register",

  EXPORT: "export",

  CONFIGURE: "configure",
} as const;

export type AuditModule = (typeof AUDIT_MODULES)[keyof typeof AUDIT_MODULES];

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
