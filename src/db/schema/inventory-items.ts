import { sql } from "drizzle-orm";

import {
  check,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies";
import { inventoryItemStatusEnum } from "./enums";
import { inventoryImports } from "./inventory-imports";

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

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
     * SKU normalizado utilizado para
     * evitar duplicados por mayúsculas/minúsculas.
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

    /*
     * STOCK
     *
     * Se conserva stock_quantity porque
     * el proyecto ya utiliza este campo.
     */
    stockQuantity: numeric("stock_quantity", {
      precision: 18,
      scale: 4,
      mode: "number",
    })
      .notNull()
      .default(0),

    /*
     * COSTO UNITARIO
     */
    unitCost: numeric("unit_cost", {
      precision: 18,
      scale: 4,
      mode: "number",
    })
      .notNull()
      .default(0),

    /*
     * VALOR DEL INVENTARIO
     *
     * stock × unitCost
     *
     * Será sincronizado desde PostgreSQL.
     */
    stockValue: numeric("stock_value", {
      precision: 18,
      scale: 4,
      mode: "number",
    })
      .notNull()
      .default(0),

    /*
     * Último movimiento.
     *
     * Se conserva last_movement_date
     * porque ya existe en la BD.
     */
    lastMovementDate: timestamp("last_movement_date", {
      withTimezone: true,
    }),

    /*
     * Ubicación física.
     *
     * Ej:
     * Almacén A
     * Rack 03
     * Tienda principal
     */
    location: varchar("location", {
      length: 200,
    }),

    /*
     * Campos ya existentes para
     * análisis posterior de inventario.
     */
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
     * Última importación que modificó
     * este producto.
     */
    lastImportId: uuid("last_import_id").references(() => inventoryImports.id, {
      onDelete: "set null",
    }),

    status: inventoryItemStatusEnum("status").notNull().default("active"),

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
     * Un SKU solamente puede existir
     * una vez por empresa.
     */
    uniqueIndex("inventory_items_company_sku_unique").on(
      table.companyId,
      table.skuNormalized,
    ),

    index("inventory_items_company_idx").on(table.companyId),

    index("inventory_items_sku_idx").on(table.skuNormalized),

    index("inventory_items_category_idx").on(table.category),

    index("inventory_items_brand_idx").on(table.brand),

    index("inventory_items_status_idx").on(table.status),

    index("inventory_items_company_status_idx").on(
      table.companyId,
      table.status,
      table.lastMovementDate,
    ),

    index("inventory_items_last_movement_idx").on(table.lastMovementDate),

    index("inventory_items_last_import_idx").on(table.lastImportId),

    check(
      "inventory_items_stock_nonnegative",
      sql`${table.stockQuantity} >= 0`,
    ),

    check("inventory_items_cost_nonnegative", sql`${table.unitCost} >= 0`),

    check(
      "inventory_items_stock_value_nonnegative",
      sql`${table.stockValue} >= 0`,
    ),

    check("inventory_items_sales_30d_nonnegative", sql`${table.sales30d} >= 0`),

    check("inventory_items_sales_90d_nonnegative", sql`${table.sales90d} >= 0`),

    check(
      "inventory_items_sales_180d_nonnegative",
      sql`${table.sales180d} >= 0`,
    ),
  ],
);
