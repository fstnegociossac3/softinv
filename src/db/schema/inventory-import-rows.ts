import {
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies";

import { inventoryImports } from "./inventory-imports";

import { inventoryImportRowStatusEnum } from "./enums";

export type ImportRowError = {
  field?: string;
  code: string;
  message: string;
};

export const inventoryImportRows = pgTable(
  "inventory_import_rows",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    importId: uuid("import_id")
      .notNull()
      .references(() => inventoryImports.id, {
        onDelete: "cascade",
      }),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "restrict",
      }),

    rowNumber: integer("row_number").notNull(),

    rawData: jsonb("raw_data").$type<Record<string, unknown>>().notNull(),

    normalizedData: jsonb("normalized_data").$type<Record<string, unknown>>(),

    status: inventoryImportRowStatusEnum("status").notNull().default("pending"),

    errors: jsonb("errors").$type<ImportRowError[]>(),

    fingerprint: varchar("fingerprint", {
      length: 64,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("inventory_import_rows_import_row_unique").on(
      table.importId,
      table.rowNumber,
    ),

    index("inventory_import_rows_import_idx").on(table.importId),

    index("inventory_import_rows_company_idx").on(table.companyId),

    index("inventory_import_rows_status_idx").on(table.status),

    index("inventory_import_rows_fingerprint_idx").on(table.fingerprint),
  ],
);
