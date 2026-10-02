import { sql } from "drizzle-orm";

import {
  check,
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { companies } from "./companies";
import { profiles } from "./profiles";
import { recoveryCases } from "./recovery-cases";

export const recoveryEvents = pgTable(
  "recovery_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "restrict",
      }),

    recoveryCaseId: uuid("recovery_case_id")
      .notNull()
      .references(() => recoveryCases.id, {
        onDelete: "cascade",
      }),

    /*
     * Unidades realmente recuperadas.
     */
    quantity: numeric("quantity", {
      precision: 18,
      scale: 4,
      mode: "number",
    }).notNull(),

    /*
     * Dinero REAL recuperado.
     *
     * No necesariamente:
     * cantidad × costo histórico.
     */
    recoveredValue: numeric("recovered_value", {
      precision: 18,
      scale: 4,
      mode: "number",
    }).notNull(),

    recoveryDate: date("recovery_date", {
      mode: "string",
    }).notNull(),

    notes: text("notes"),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id, {
        onDelete: "restrict",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("recovery_events_company_idx").on(table.companyId),

    index("recovery_events_case_idx").on(table.recoveryCaseId),

    /*
     * Principal para:
     *
     * filtro fechas
     * KPI
     * gráfico temporal
     */
    index("recovery_events_company_date_idx").on(
      table.companyId,
      table.recoveryDate,
    ),

    index("recovery_events_case_date_idx").on(
      table.recoveryCaseId,
      table.recoveryDate,
    ),

    check(
      "recovery_events_quantity_positive",
      sql`
        ${table.quantity} > 0
      `,
    ),

    check(
      "recovery_events_value_positive",
      sql`
        ${table.recoveredValue} > 0
      `,
    ),
  ],
);
