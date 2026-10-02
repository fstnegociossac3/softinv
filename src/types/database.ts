import {
  auditLogs,
  companies,
  companyUsers,
  inventoryItemSnapshots,
  inventoryItems,
  inventoryMovements,
  profiles,
  trackingActions,
  trackingActivities,
  recoveryCases,
  recoveryEvents,
  reports,
  companySettings,
} from "@/db/schema";

export type Company = typeof companies.$inferSelect;

export type NewCompany = typeof companies.$inferInsert;

export type Profile = typeof profiles.$inferSelect;

export type NewProfile = typeof profiles.$inferInsert;

export type CompanyUser = typeof companyUsers.$inferSelect;

export type AuditLog = typeof auditLogs.$inferSelect;

/*
|--------------------------------------------------------------------------
| INVENTARIO Y ANALISIS IRI
|--------------------------------------------------------------------------
*/

export type InventoryItem = typeof inventoryItems.$inferSelect;

export type NewInventoryItem = typeof inventoryItems.$inferInsert;

export type InventoryItemSnapshot = typeof inventoryItemSnapshots.$inferSelect;

export type NewInventoryItemSnapshot =
  typeof inventoryItemSnapshots.$inferInsert;

export type InventoryMovement = typeof inventoryMovements.$inferSelect;

export type NewInventoryMovement = typeof inventoryMovements.$inferInsert;

/*
|--------------------------------------------------------------------------
| SEGUIMIENTO
|--------------------------------------------------------------------------
*/

export type TrackingAction = typeof trackingActions.$inferSelect;

export type NewTrackingAction = typeof trackingActions.$inferInsert;

export type TrackingActivity = typeof trackingActivities.$inferSelect;

export type NewTrackingActivity = typeof trackingActivities.$inferInsert;

/*
|--------------------------------------------------------------------------
| RECUPERACIÓN
|--------------------------------------------------------------------------
*/

export type RecoveryCase = typeof recoveryCases.$inferSelect;

export type NewRecoveryCase = typeof recoveryCases.$inferInsert;

export type RecoveryEvent = typeof recoveryEvents.$inferSelect;

export type NewRecoveryEvent = typeof recoveryEvents.$inferInsert;

/*
|--------------------------------------------------------------------------
| REPORTES
|--------------------------------------------------------------------------
*/

export type Report = typeof reports.$inferSelect;

export type NewReport = typeof reports.$inferInsert;

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN
|--------------------------------------------------------------------------
*/

export type CompanySetting = typeof companySettings.$inferSelect;

export type NewCompanySetting = typeof companySettings.$inferInsert;
