import { sql } from "drizzle-orm";

import {
  check,
  index,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { companies } from "./companies";
import { inventoryItems } from "./inventory-items";
import { profiles } from "./profiles";
import { trackingActions } from "./tracking-actions";

import { recommendationActionEnum, recoveryCaseStatusEnum } from "./enums";

export const recoveryCases = pgTable(
  "recovery_cases",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "restrict",
      }),

    /*
     * Cada acción ejecutada de Seguimiento
     * puede originar un solo caso.
     */
    trackingActionId: uuid("tracking_action_id")
      .notNull()
      .references(() => trackingActions.id, {
        onDelete: "restrict",
      }),

    inventoryItemId: uuid("inventory_item_id")
      .notNull()
      .references(() => inventoryItems.id, {
        onDelete: "restrict",
      }),

    /*
    |--------------------------------------------------------------------------
    | SNAPSHOT HISTÓRICO
    |--------------------------------------------------------------------------
    */

    recommendationAction: recommendationActionEnum(
      "recommendation_action",
    ).notNull(),

    initialStockQuantity: numeric("initial_stock_quantity", {
      precision: 18,
      scale: 4,
      mode: "number",
    }).notNull(),

    initialUnitCost: numeric("initial_unit_cost", {
      precision: 18,
      scale: 4,
      mode: "number",
    }).notNull(),

    initialStockValue: numeric("initial_stock_value", {
      precision: 18,
      scale: 4,
      mode: "number",
    }).notNull(),

    /*
     * Capital que estimábamos
     * recuperar cuando inició
     * el seguimiento.
     */
    potentialRecoverableValue: numeric("potential_recoverable_value", {
      precision: 18,
      scale: 4,
      mode: "number",
    })
      .notNull()
      .default(0),

    status: recoveryCaseStatusEnum("status").notNull().default("pending"),

    /*
     * Equivale normalmente a
     * tracking_actions.executed_at.
     */
    startedAt: timestamp("started_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    closedAt: timestamp("closed_at", {
      withTimezone: true,
    }),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id, {
        onDelete: "restrict",
      }),

    closedBy: uuid("closed_by").references(() => profiles.id, {
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
     * 1 tracking_action = 1 recovery_case
     */
    uniqueIndex("recovery_cases_tracking_action_unique").on(
      table.trackingActionId,
    ),

    index("recovery_cases_company_idx").on(table.companyId),

    index("recovery_cases_item_idx").on(table.inventoryItemId),

    index("recovery_cases_company_status_idx").on(
      table.companyId,
      table.status,
    ),

    index("recovery_cases_company_started_idx").on(
      table.companyId,
      table.startedAt,
    ),

    index("recovery_cases_action_idx").on(table.recommendationAction),

    check(
      "recovery_cases_stock_nonnegative",
      sql`
        ${table.initialStockQuantity}
        >= 0
      `,
    ),

    check(
      "recovery_cases_cost_nonnegative",
      sql`
        ${table.initialUnitCost}
        >= 0
      `,
    ),

    check(
      "recovery_cases_value_nonnegative",
      sql`
        ${table.initialStockValue}
        >= 0
      `,
    ),

    check(
      "recovery_cases_potential_nonnegative",
      sql`
        ${table.potentialRecoverableValue}
        >= 0
      `,
    ),
  ],
);
