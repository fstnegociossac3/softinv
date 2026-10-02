import { sql } from "drizzle-orm";

import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import type { ReportSnapshot } from "@/lib/reports/types";

import { companies } from "./companies";

import { profiles } from "./profiles";

import { reportTypeEnum } from "./enums";

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "restrict",
      }),

    reportType: reportTypeEnum("report_type").notNull(),

    dateFrom: date("date_from", {
      mode: "string",
    }).notNull(),

    dateTo: date("date_to", {
      mode: "string",
    }).notNull(),

    /*
     * Fotografía inmutable.
     *
     * Las futuras descargas PDF/XLSX
     * se generan desde aquí.
     */
    snapshotData: jsonb("snapshot_data").$type<ReportSnapshot>().notNull(),

    snapshotVersion: integer("snapshot_version").notNull().default(1),

    generatedBy: uuid("generated_by")
      .notNull()
      .references(() => profiles.id, {
        onDelete: "restrict",
      }),

    generatedAt: timestamp("generated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("reports_company_idx").on(table.companyId),

    index("reports_type_idx").on(table.reportType),

    index("reports_generated_by_idx").on(table.generatedBy),

    index("reports_generated_at_idx").on(table.generatedAt),

    /*
     * Principal para la tabla
     * Reportes Generados.
     */
    index("reports_company_generated_idx").on(
      table.companyId,
      table.generatedAt,
    ),

    index("reports_company_type_generated_idx").on(
      table.companyId,
      table.reportType,
      table.generatedAt,
    ),

    check(
      "reports_date_range_check",
      sql`
        ${table.dateFrom}
        <=
        ${table.dateTo}
      `,
    ),
  ],
);
