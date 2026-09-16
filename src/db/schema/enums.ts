import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "user",
]);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
]);

export const companyStatusEnum = pgEnum("company_status", [
  "active",
  "inactive",
]);