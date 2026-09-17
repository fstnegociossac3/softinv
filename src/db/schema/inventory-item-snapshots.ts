import {
  index,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { companies } from "./companies";

import { inventoryImports } from "./inventory-imports";

import { inventoryImportRows } from "./inventory-import-rows";

import { inventoryItems } from "./inventory-items";

export const inventoryItemSnapshots = pgTable(
  "inventory_item_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "restrict",
      }),

    inventoryItemId: uuid("inventory_item_id")
      .notNull()
      .references(() => inventoryItems.id, {
        onDelete: "cascade",
      }),

    importId: uuid("import_id").references(() => inventoryImports.id, {
      onDelete: "set null",
    }),

    importRowId: uuid("import_row_id").references(
      () => inventoryImportRows.id,
      {
        onDelete: "set null",
      },
    ),

    stockQuantity: numeric("stock_quantity", {
      precision: 18,
      scale: 4,
      mode: "number",
    }).notNull(),

    unitCost: numeric("unit_cost", {
      precision: 18,
      scale: 4,
      mode: "number",
    }).notNull(),

    lastMovementDate: timestamp("last_movement_date", {
      withTimezone: true,
    }),

    sales30d: numeric("sales_30d", {
      precision: 18,
      scale: 4,
      mode: "number",
    })
      .notNull()
      .default(0),

    sales90d: numeric("sales_90d", {
      precision: 18,
      scale: 4,
      mode: "number",
    })
      .notNull()
      .default(0),

    sales180d: numeric("sales_180d", {
      precision: 18,
      scale: 4,
      mode: "number",
    })
      .notNull()
      .default(0),

    capturedAt: timestamp("captured_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    /*
     * Un SKU solamente tendrá
     * un snapshot por importación.
     */
    uniqueIndex("inventory_snapshots_item_import_unique").on(
      table.inventoryItemId,
      table.importId,
    ),

    index("inventory_snapshots_company_idx").on(table.companyId),

    index("inventory_snapshots_item_idx").on(table.inventoryItemId),

    index("inventory_snapshots_import_idx").on(table.importId),

    index("inventory_snapshots_captured_at_idx").on(table.capturedAt),
  ],
);
