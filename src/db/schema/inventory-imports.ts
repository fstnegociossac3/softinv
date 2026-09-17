import {
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies";
import { profiles } from "./profiles";

import { inventoryImportSourceEnum, inventoryImportStatusEnum } from "./enums";

export const inventoryImports = pgTable(
  "inventory_imports",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "restrict",
      }),

    createdBy: uuid("created_by").references(() => profiles.id, {
      onDelete: "set null",
    }),

    originalFileName: varchar("original_file_name", {
      length: 255,
    }).notNull(),

    sourceType: inventoryImportSourceEnum("source_type").notNull(),

    sheetName: varchar("sheet_name", {
      length: 150,
    }),

    status: inventoryImportStatusEnum("status").notNull().default("uploaded"),

    totalRows: integer("total_rows").notNull().default(0),

    validRows: integer("valid_rows").notNull().default(0),

    invalidRows: integer("invalid_rows").notNull().default(0),

    duplicateRows: integer("duplicate_rows").notNull().default(0),

    headers: jsonb("headers").$type<string[]>().notNull(),

    columnMapping: jsonb("column_mapping").$type<Record<string, string>>(),

    errorSummary: jsonb("error_summary").$type<Record<string, number>>(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),
  },
  (table) => [
    index("inventory_imports_company_idx").on(table.companyId),

    index("inventory_imports_created_by_idx").on(table.createdBy),

    index("inventory_imports_status_idx").on(table.status),

    index("inventory_imports_created_at_idx").on(table.createdAt),
  ],
);
