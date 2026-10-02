import { sql } from "drizzle-orm";

import {
  check,
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { companies } from "./companies";
import { inventoryItems } from "./inventory-items";
import { profiles } from "./profiles";

import { recommendationActionEnum, trackingActionStatusEnum } from "./enums";

export const trackingActions = pgTable(
  "tracking_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    /*
    |--------------------------------------------------------------------------
    | EMPRESA
    |--------------------------------------------------------------------------
    */

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "restrict",
      }),

    /*
    |--------------------------------------------------------------------------
    | SKU
    |--------------------------------------------------------------------------
    */

    inventoryItemId: uuid("inventory_item_id")
      .notNull()
      .references(() => inventoryItems.id, {
        /*
         * No eliminamos el historial
         * aunque el producto quisiera
         * eliminarse posteriormente.
         */
        onDelete: "restrict",
      }),

    /*
    |--------------------------------------------------------------------------
    | SNAPSHOT DE LA RECOMENDACIÓN
    |--------------------------------------------------------------------------
    */

    recommendationAction: recommendationActionEnum(
      "recommendation_action",
    ).notNull(),

    recommendationReason: text("recommendation_reason").notNull(),

    /*
     * Valor del IRI cuando
     * se creó el seguimiento.
     */
    iriValue: numeric("iri_value", {
      precision: 5,
      scale: 2,
      mode: "number",
    }).notNull(),

    /*
     * Stock en ese momento.
     */
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

    stockValue: numeric("stock_value", {
      precision: 18,
      scale: 4,
      mode: "number",
    }).notNull(),

    /*
     * Contexto adicional
     * de la recomendación.
     */
    coverageDays: numeric("coverage_days", {
      precision: 12,
      scale: 2,
      mode: "number",
    }),

    potentialRotationPercentage: numeric("potential_rotation_percentage", {
      precision: 5,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),

    /*
    |--------------------------------------------------------------------------
    | PERIODO QUE GENERÓ LA RECOMENDACIÓN
    |--------------------------------------------------------------------------
    */

    analysisFrom: date("analysis_from", {
      mode: "string",
    }).notNull(),

    analysisTo: date("analysis_to", {
      mode: "string",
    }).notNull(),

    /*
    |--------------------------------------------------------------------------
    | ESTADO
    |--------------------------------------------------------------------------
    */

    status: trackingActionStatusEnum("status").notNull().default("pending"),

    /*
     * Fecha en que se tomó
     * la recomendación.
     */
    recommendationDate: timestamp("recommendation_date", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    /*
     * Fecha límite.
     *
     * Es DATE porque el seguimiento
     * trabaja por día, no por hora.
     */
    dueDate: date("due_date", {
      mode: "string",
    }).notNull(),

    executedAt: timestamp("executed_at", {
      withTimezone: true,
    }),

    /*
    |--------------------------------------------------------------------------
    | OBSERVACIÓN INICIAL
    |--------------------------------------------------------------------------
    */

    notes: text("notes"),

    /*
    |--------------------------------------------------------------------------
    | RESPONSABLES
    |--------------------------------------------------------------------------
    */

    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id, {
        onDelete: "restrict",
      }),

    executedBy: uuid("executed_by").references(() => profiles.id, {
      onDelete: "set null",
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
     * Solamente una acción pendiente
     * por SKU.
     *
     * Evita crear:
     *
     * A001 -> Ofertar pendiente
     * A001 -> Ofertar pendiente
     *
     * simultáneamente.
     */
    uniqueIndex("tracking_actions_one_pending_per_item_unique")
      .on(table.companyId, table.inventoryItemId)
      .where(sql`${table.status} = 'pending'`),

    index("tracking_actions_company_idx").on(table.companyId),

    index("tracking_actions_item_idx").on(table.inventoryItemId),

    index("tracking_actions_company_status_idx").on(
      table.companyId,
      table.status,
    ),

    /*
     * Principal índice para:
     *
     * pendientes
     * vencidas
     * filtro por fecha
     */
    index("tracking_actions_company_due_status_idx").on(
      table.companyId,
      table.dueDate,
      table.status,
    ),

    index("tracking_actions_recommendation_idx").on(table.recommendationAction),

    index("tracking_actions_created_at_idx").on(table.createdAt),

    /*
    |--------------------------------------------------------------------------
    | CHECKS
    |--------------------------------------------------------------------------
    */

    check(
      "tracking_actions_iri_range",
      sql`
        ${table.iriValue} >= 0
        AND
        ${table.iriValue} <= 100
      `,
    ),

    check(
      "tracking_actions_stock_nonnegative",
      sql`
        ${table.stockQuantity} >= 0
      `,
    ),

    check(
      "tracking_actions_cost_nonnegative",
      sql`
        ${table.unitCost} >= 0
      `,
    ),

    check(
      "tracking_actions_value_nonnegative",
      sql`
        ${table.stockValue} >= 0
      `,
    ),

    check(
      "tracking_actions_rotation_range",
      sql`
        ${table.potentialRotationPercentage} >= 0
        AND
        ${table.potentialRotationPercentage} <= 100
      `,
    ),

    check(
      "tracking_actions_analysis_range",
      sql`
        ${table.analysisFrom}
        <=
        ${table.analysisTo}
      `,
    ),
  ],
);
