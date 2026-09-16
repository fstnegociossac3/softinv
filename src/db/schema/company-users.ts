import { pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { companies } from "./companies";
import { profiles } from "./profiles";

export const companyUsers = pgTable(
  "company_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, {
        onDelete: "cascade",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("company_users_user_unique").on(table.userId),

    uniqueIndex("company_users_company_user_unique").on(
      table.companyId,
      table.userId,
    ),
  ],
);
