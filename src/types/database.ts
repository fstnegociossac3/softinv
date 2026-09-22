import {
  auditLogs,
  companies,
  companyUsers,
  inventoryItemSnapshots,
  inventoryItems,
  inventoryMovements,
  profiles,
} from "@/db/schema";

export type Company = typeof companies.$inferSelect;

export type NewCompany = typeof companies.$inferInsert;

export type Profile = typeof profiles.$inferSelect;

export type NewProfile = typeof profiles.$inferInsert;

export type CompanyUser = typeof companyUsers.$inferSelect;

export type AuditLog = typeof auditLogs.$inferSelect;

export type InventoryItem = typeof inventoryItems.$inferSelect;

export type NewInventoryItem = typeof inventoryItems.$inferInsert;

export type InventoryItemSnapshot = typeof inventoryItemSnapshots.$inferSelect;

export type NewInventoryItemSnapshot =
  typeof inventoryItemSnapshots.$inferInsert;

export type InventoryMovement = typeof inventoryMovements.$inferSelect;

export type NewInventoryMovement = typeof inventoryMovements.$inferInsert;
