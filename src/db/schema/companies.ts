import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companyStatusEnum } from "./enums";

export const companies = pgTable(
  "companies",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    name: varchar("name", {
      length: 200,
    }).notNull(),

    ruc: varchar("ruc", {
      length: 20,
    }),

    sector: varchar("sector", {
      length: 150,
    }),

    country: varchar("country", {
      length: 100,
    })
      .notNull()
      .default("Perú"),

    timezone: varchar("timezone", {
      length: 100,
    })
      .notNull()
      .default("America/Lima"),

    currency: varchar("currency", {
      length: 10,
    })
      .notNull()
      .default("PEN"),

    status: companyStatusEnum("status")
      .notNull()
      .default("active"),

    address: text("address"),

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
    uniqueIndex("companies_ruc_unique")
      .on(table.ruc),
  ]
);