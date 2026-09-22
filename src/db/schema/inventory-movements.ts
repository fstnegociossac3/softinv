import { sql } from "drizzle-orm";

import {
  check,
  index,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies";
import { inventoryItems } from "./inventory-items";

export const inventoryMovements = pgTable(
  "inventory_movements",
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

    /*
     * Valores previstos:
     *
     * entry
     * exit
     * adjustment
     * import
     */
    movementType: varchar("movement_type", {
      length: 30,
    }).notNull(),

    quantity: numeric("quantity", {
      precision: 18,
      scale: 4,
      mode: "number",
    }).notNull(),

    movementDate: timestamp("movement_date", {
      withTimezone: true,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("inventory_movements_company_idx").on(table.companyId),

    index("inventory_movements_item_idx").on(table.inventoryItemId),

    index("inventory_movements_date_idx").on(table.movementDate),

    index("inventory_movements_type_idx").on(table.movementType),

    index("inventory_movements_company_date_item_idx").on(
      table.companyId,
      table.movementDate,
      table.inventoryItemId,
    ),

    check("inventory_movements_quantity_positive", sql`${table.quantity} > 0`),
  ],
);
