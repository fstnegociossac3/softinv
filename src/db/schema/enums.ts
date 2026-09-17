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
