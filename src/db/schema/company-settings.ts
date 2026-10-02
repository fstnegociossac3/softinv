import {
  index,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type {
  IriSettingsConfig,
  NotificationSettingsConfig,
  RecommendationSettingsConfig,
  TrafficLightSettingsConfig,
} from "@/lib/settings/types";

import { companies } from "./companies";

import { profiles } from "./profiles";

export const companySettings = pgTable(
  "company_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    /*
     * Una empresa solamente puede
     * tener una configuración.
     */
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    iriConfig: jsonb("iri_config").$type<IriSettingsConfig>().notNull(),

    recommendationConfig: jsonb("recommendation_config")
      .$type<RecommendationSettingsConfig>()
      .notNull(),

    trafficLightConfig: jsonb("traffic_light_config")
      .$type<TrafficLightSettingsConfig>()
      .notNull(),

    notificationConfig: jsonb("notification_config")
      .$type<NotificationSettingsConfig>()
      .notNull(),

    /*
     * Último administrador
     * que modificó la configuración.
     */
    updatedBy: uuid("updated_by")
      .notNull()
      .references(() => profiles.id, {
        onDelete: "restrict",
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
    uniqueIndex("company_settings_company_unique").on(table.companyId),

    index("company_settings_updated_by_idx").on(table.updatedBy),
  ],
);
