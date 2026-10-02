import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { companies } from "./companies";
import { profiles } from "./profiles";
import { trackingActions } from "./tracking-actions";

import { trackingActivityTypeEnum } from "./enums";

export const trackingActivities = pgTable(
  "tracking_activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "restrict",
      }),

    trackingActionId: uuid("tracking_action_id")
      .notNull()
      .references(() => trackingActions.id, {
        onDelete: "cascade",
      }),

    activityType: trackingActivityTypeEnum("activity_type").notNull(),

    description: text("description").notNull(),

    /*
     * Datos adicionales:
     *
     * oldDueDate
     * newDueDate
     * action
     * etc.
     */
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),

    userId: uuid("user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("tracking_activities_company_idx").on(table.companyId),

    index("tracking_activities_action_idx").on(table.trackingActionId),

    index("tracking_activities_type_idx").on(table.activityType),

    index("tracking_activities_company_created_idx").on(
      table.companyId,
      table.createdAt,
    ),

    index("tracking_activities_action_created_idx").on(
      table.trackingActionId,
      table.createdAt,
    ),
  ],
);
