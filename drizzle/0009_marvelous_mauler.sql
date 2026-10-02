CREATE TYPE "public"."recommendation_action" AS ENUM('maintain', 'redistribute', 'offer', 'liquidate');--> statement-breakpoint
CREATE TYPE "public"."tracking_action_status" AS ENUM('pending', 'executed');--> statement-breakpoint
CREATE TYPE "public"."tracking_activity_type" AS ENUM('created', 'due_date_changed', 'note_added', 'executed', 'updated');--> statement-breakpoint
CREATE TABLE "tracking_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"recommendation_action" "recommendation_action" NOT NULL,
	"recommendation_reason" text NOT NULL,
	"iri_value" numeric(5, 2) NOT NULL,
	"stock_quantity" numeric(18, 4) NOT NULL,
	"unit_cost" numeric(18, 4) NOT NULL,
	"stock_value" numeric(18, 4) NOT NULL,
	"coverage_days" numeric(12, 2),
	"potential_rotation_percentage" numeric(5, 2) DEFAULT 0 NOT NULL,
	"analysis_from" date NOT NULL,
	"analysis_to" date NOT NULL,
	"status" "tracking_action_status" DEFAULT 'pending' NOT NULL,
	"recommendation_date" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" date NOT NULL,
	"executed_at" timestamp with time zone,
	"notes" text,
	"created_by" uuid NOT NULL,
	"executed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tracking_actions_iri_range" CHECK (
        "tracking_actions"."iri_value" >= 0
        AND
        "tracking_actions"."iri_value" <= 100
      ),
	CONSTRAINT "tracking_actions_stock_nonnegative" CHECK (
        "tracking_actions"."stock_quantity" >= 0
      ),
	CONSTRAINT "tracking_actions_cost_nonnegative" CHECK (
        "tracking_actions"."unit_cost" >= 0
      ),
	CONSTRAINT "tracking_actions_value_nonnegative" CHECK (
        "tracking_actions"."stock_value" >= 0
      ),
	CONSTRAINT "tracking_actions_rotation_range" CHECK (
        "tracking_actions"."potential_rotation_percentage" >= 0
        AND
        "tracking_actions"."potential_rotation_percentage" <= 100
      ),
	CONSTRAINT "tracking_actions_analysis_range" CHECK (
        "tracking_actions"."analysis_from"
        <=
        "tracking_actions"."analysis_to"
      )
);
--> statement-breakpoint
CREATE TABLE "tracking_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"tracking_action_id" uuid NOT NULL,
	"activity_type" "tracking_activity_type" NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tracking_actions" ADD CONSTRAINT "tracking_actions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_actions" ADD CONSTRAINT "tracking_actions_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_actions" ADD CONSTRAINT "tracking_actions_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_actions" ADD CONSTRAINT "tracking_actions_executed_by_profiles_id_fk" FOREIGN KEY ("executed_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_activities" ADD CONSTRAINT "tracking_activities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_activities" ADD CONSTRAINT "tracking_activities_tracking_action_id_tracking_actions_id_fk" FOREIGN KEY ("tracking_action_id") REFERENCES "public"."tracking_actions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_activities" ADD CONSTRAINT "tracking_activities_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tracking_actions_one_pending_per_item_unique" ON "tracking_actions" USING btree ("company_id","inventory_item_id") WHERE "tracking_actions"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "tracking_actions_company_idx" ON "tracking_actions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "tracking_actions_item_idx" ON "tracking_actions" USING btree ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "tracking_actions_company_status_idx" ON "tracking_actions" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "tracking_actions_company_due_status_idx" ON "tracking_actions" USING btree ("company_id","due_date","status");--> statement-breakpoint
CREATE INDEX "tracking_actions_recommendation_idx" ON "tracking_actions" USING btree ("recommendation_action");--> statement-breakpoint
CREATE INDEX "tracking_actions_created_at_idx" ON "tracking_actions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tracking_activities_company_idx" ON "tracking_activities" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "tracking_activities_action_idx" ON "tracking_activities" USING btree ("tracking_action_id");--> statement-breakpoint
CREATE INDEX "tracking_activities_type_idx" ON "tracking_activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "tracking_activities_company_created_idx" ON "tracking_activities" USING btree ("company_id","created_at");--> statement-breakpoint
CREATE INDEX "tracking_activities_action_created_idx" ON "tracking_activities" USING btree ("tracking_action_id","created_at");

-- ============================================================
-- SEGUIMIENTO - ROW LEVEL SECURITY
-- ============================================================


-- ============================================================
-- TRACKING ACTIONS
-- ============================================================

ALTER TABLE public.tracking_actions
ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint


REVOKE ALL
ON TABLE public.tracking_actions
FROM anon;

--> statement-breakpoint


REVOKE ALL
ON TABLE public.tracking_actions
FROM authenticated;

--> statement-breakpoint


GRANT SELECT
ON TABLE public.tracking_actions
TO authenticated;

--> statement-breakpoint


DROP POLICY IF EXISTS
"tracking_actions_select_scope"
ON public.tracking_actions;

--> statement-breakpoint


CREATE POLICY
"tracking_actions_select_scope"
ON public.tracking_actions
FOR SELECT
TO authenticated
USING (
  (
    SELECT
      private.is_admin()
  )
  OR
  company_id = (
    SELECT
      private.current_company_id()
  )
);

--> statement-breakpoint


-- ============================================================
-- TRACKING ACTIVITIES
-- ============================================================

ALTER TABLE public.tracking_activities
ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint


REVOKE ALL
ON TABLE public.tracking_activities
FROM anon;

--> statement-breakpoint


REVOKE ALL
ON TABLE public.tracking_activities
FROM authenticated;

--> statement-breakpoint


GRANT SELECT
ON TABLE public.tracking_activities
TO authenticated;

--> statement-breakpoint


DROP POLICY IF EXISTS
"tracking_activities_select_scope"
ON public.tracking_activities;

--> statement-breakpoint


CREATE POLICY
"tracking_activities_select_scope"
ON public.tracking_activities
FOR SELECT
TO authenticated
USING (
  (
    SELECT
      private.is_admin()
  )
  OR
  company_id = (
    SELECT
      private.current_company_id()
  )
);