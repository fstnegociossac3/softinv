import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { userRoleEnum, userStatusEnum } from "./enums";

export const profiles = pgTable("profiles", {
  /*
   * Este UUID será el mismo UUID
   * generado por Supabase Auth.
   *
   * profiles.id = auth.users.id
   */
  id: uuid("id").primaryKey(),

  fullName: varchar("full_name", {
    length: 200,
  }).notNull(),

  role: userRoleEnum("role").notNull().default("user"),

  status: userStatusEnum("status").notNull().default("active"),

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
});
