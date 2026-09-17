import {
  check,
  index,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  text,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";

import { companies } from "./companies";

import { inventoryImports } from "./inventory-imports";

import { inventoryItemStatusEnum } from "./enums";

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    /*
     * Todo SKU pertenece
     * obligatoriamente a una empresa.
     */
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "restrict",
      }),

    /*
     * SKU original mostrado al usuario.
     */
    sku: varchar("sku", {
      length: 100,
    }).notNull(),

    /*
     * Versión normalizada para garantizar
     * unicidad sin diferencias de
     * mayúsculas/minúsculas.
     *
     * Ejemplo:
     * ab-001 → AB-001
     */
    skuNormalized: varchar("sku_normalized", {
      length: 100,
    }).notNull(),

    description: text("description").notNull(),

    category: varchar("category", {
      length: 150,
    }),

    brand: varchar("brand", {
      length: 150,
    }),

    stockQuantity: numeric("stock_quantity", {
      precision: 18,
      scale: 4,
      mode: "number",
    })
      .notNull()
      .default(0),

    unitCost: numeric("unit_cost", {
      precision: 18,
      scale: 4,
      mode: "number",
    })
      .notNull()
      .default(0),

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

    /*
     * Última importación que
     * actualizó este SKU.
     *
     * Puede ser NULL si posteriormente
     * permitimos creación manual.
     */
    lastImportId: uuid("last_import_id").references(() => inventoryImports.id, {
      onDelete: "set null",
    }),

    status: inventoryItemStatusEnum("status").notNull().default("active"),

    /*
     * Fecha en la que apareció
     * por última vez en una importación.
     */
    lastImportedAt: timestamp("last_imported_at", {
      withTimezone: true,
    }),

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
  },

  (table) => [
    /*
     * Una empresa no puede tener
     * dos veces el mismo SKU normalizado.
     */
    uniqueIndex("inventory_items_company_sku_unique").on(
      table.companyId,
      table.skuNormalized,
    ),

    index("inventory_items_company_idx").on(table.companyId),

    index("inventory_items_sku_idx").on(table.skuNormalized),

    index("inventory_items_status_idx").on(table.status),

    index("inventory_items_company_status_idx").on(
      table.companyId,
      table.status,
    ),

    index("inventory_items_last_movement_idx").on(table.lastMovementDate),

    index("inventory_items_last_import_idx").on(table.lastImportId),

    check(
      "inventory_items_stock_nonnegative",
      sql`
          ${table.stockQuantity}
          >= 0
        `,
    ),

    check(
      "inventory_items_cost_nonnegative",
      sql`
          ${table.unitCost}
          >= 0
        `,
    ),

    check(
      "inventory_items_sales_30d_nonnegative",
      sql`
          ${table.sales30d}
          >= 0
        `,
    ),

    check(
      "inventory_items_sales_90d_nonnegative",
      sql`
          ${table.sales90d}
          >= 0
        `,
    ),

    check(
      "inventory_items_sales_180d_nonnegative",
      sql`
          ${table.sales180d}
          >= 0
        `,
    ),
  ],
);
