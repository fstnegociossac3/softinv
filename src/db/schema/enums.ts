import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);

export const userStatusEnum = pgEnum("user_status", ["active", "inactive"]);

export const companyStatusEnum = pgEnum("company_status", [
  "active",
  "inactive",
]);

export const inventoryImportStatusEnum = pgEnum("inventory_import_status", [
  "uploaded",
  "validating",
  "ready",
  "processed",
  "failed",
]);

export const inventoryImportRowStatusEnum = pgEnum(
  "inventory_import_row_status",
  ["pending", "valid", "invalid", "duplicate"],
);

export const inventoryImportSourceEnum = pgEnum("inventory_import_source", [
  "xlsx",
  "xls",
  "csv",
]);

export const inventoryItemStatusEnum = pgEnum("inventory_item_status", [
  "active",
  "inactive",
]);

/*
|--------------------------------------------------------------------------
| RECOMENDACIONES
|--------------------------------------------------------------------------
|
| Esta misma clasificación se utiliza
| posteriormente dentro de Seguimiento.
|
*/

export const recommendationActionEnum = pgEnum("recommendation_action", [
  "maintain",
  "redistribute",
  "offer",
  "liquidate",
]);

/*
|--------------------------------------------------------------------------
| SEGUIMIENTO
|--------------------------------------------------------------------------
|
| VENCIDA NO se almacena.
|
| overdue =
| pending + due_date < hoy
|
*/

export const trackingActionStatusEnum = pgEnum("tracking_action_status", [
  "pending",
  "executed",
]);

/*
|--------------------------------------------------------------------------
| ACTIVIDADES DEL SEGUIMIENTO
|--------------------------------------------------------------------------
*/

export const trackingActivityTypeEnum = pgEnum("tracking_activity_type", [
  "created",
  "due_date_changed",
  "note_added",
  "executed",
  "updated",
]);

/*
|--------------------------------------------------------------------------
| RECUPERACIÓN
|--------------------------------------------------------------------------
*/

export const recoveryCaseStatusEnum = pgEnum("recovery_case_status", [
  "pending",
  "in_progress",
  "recovered",
  "unrecovered",
]);

/*
|--------------------------------------------------------------------------
| REPORTES
|--------------------------------------------------------------------------
*/

export const reportTypeEnum = pgEnum("report_type", [
  "executive",
  "critical_inventory",
  "recommendations",
  "recovery",
]);
