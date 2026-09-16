import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies";
import { profiles } from "./profiles";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),

    userId: uuid("user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),

    module: varchar("module", {
      length: 100,
    }).notNull(),

    action: varchar("action", {
      length: 100,
    }).notNull(),

    entityType: varchar("entity_type", {
      length: 100,
    }),

    entityId: text("entity_id"),

    oldValues: jsonb("old_values"),

    newValues: jsonb("new_values"),

    metadata: jsonb("metadata"),

    requestId: varchar("request_id", {
      length: 150,
    }),

    ipAddress: varchar("ip_address", {
      length: 64,
    }),

    userAgent: text("user_agent"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_company_idx").on(table.companyId),

    index("audit_logs_user_idx").on(table.userId),

    index("audit_logs_created_at_idx").on(table.createdAt),

    index("audit_logs_module_idx").on(table.module),

    index("audit_logs_action_idx").on(table.action),

    index("audit_logs_entity_idx").on(table.entityType, table.entityId),

    index("audit_logs_company_created_idx").on(
      table.companyId,
      table.createdAt,
    ),
  ],
);
