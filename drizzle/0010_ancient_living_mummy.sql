CREATE TYPE "public"."recovery_case_status" AS ENUM('pending', 'in_progress', 'recovered', 'unrecovered');--> statement-breakpoint
CREATE TABLE "recovery_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"tracking_action_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"recommendation_action" "recommendation_action" NOT NULL,
	"initial_stock_quantity" numeric(18, 4) NOT NULL,
	"initial_unit_cost" numeric(18, 4) NOT NULL,
	"initial_stock_value" numeric(18, 4) NOT NULL,
	"potential_recoverable_value" numeric(18, 4) DEFAULT 0 NOT NULL,
	"status" "recovery_case_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"closed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recovery_cases_stock_nonnegative" CHECK (
        "recovery_cases"."initial_stock_quantity"
        >= 0
      ),
	CONSTRAINT "recovery_cases_cost_nonnegative" CHECK (
        "recovery_cases"."initial_unit_cost"
        >= 0
      ),
	CONSTRAINT "recovery_cases_value_nonnegative" CHECK (
        "recovery_cases"."initial_stock_value"
        >= 0
      ),
	CONSTRAINT "recovery_cases_potential_nonnegative" CHECK (
        "recovery_cases"."potential_recoverable_value"
        >= 0
      )
);
--> statement-breakpoint
CREATE TABLE "recovery_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"recovery_case_id" uuid NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"recovered_value" numeric(18, 4) NOT NULL,
	"recovery_date" date NOT NULL,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recovery_events_quantity_positive" CHECK (
        "recovery_events"."quantity" > 0
      ),
	CONSTRAINT "recovery_events_value_positive" CHECK (
        "recovery_events"."recovered_value" > 0
      )
);
--> statement-breakpoint
ALTER TABLE "recovery_cases" ADD CONSTRAINT "recovery_cases_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_cases" ADD CONSTRAINT "recovery_cases_tracking_action_id_tracking_actions_id_fk" FOREIGN KEY ("tracking_action_id") REFERENCES "public"."tracking_actions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_cases" ADD CONSTRAINT "recovery_cases_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_cases" ADD CONSTRAINT "recovery_cases_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_cases" ADD CONSTRAINT "recovery_cases_closed_by_profiles_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_events" ADD CONSTRAINT "recovery_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_events" ADD CONSTRAINT "recovery_events_recovery_case_id_recovery_cases_id_fk" FOREIGN KEY ("recovery_case_id") REFERENCES "public"."recovery_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_events" ADD CONSTRAINT "recovery_events_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "recovery_cases_tracking_action_unique" ON "recovery_cases" USING btree ("tracking_action_id");--> statement-breakpoint
CREATE INDEX "recovery_cases_company_idx" ON "recovery_cases" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "recovery_cases_item_idx" ON "recovery_cases" USING btree ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "recovery_cases_company_status_idx" ON "recovery_cases" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "recovery_cases_company_started_idx" ON "recovery_cases" USING btree ("company_id","started_at");--> statement-breakpoint
CREATE INDEX "recovery_cases_action_idx" ON "recovery_cases" USING btree ("recommendation_action");--> statement-breakpoint
CREATE INDEX "recovery_events_company_idx" ON "recovery_events" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "recovery_events_case_idx" ON "recovery_events" USING btree ("recovery_case_id");--> statement-breakpoint
CREATE INDEX "recovery_events_company_date_idx" ON "recovery_events" USING btree ("company_id","recovery_date");--> statement-breakpoint
CREATE INDEX "recovery_events_case_date_idx" ON "recovery_events" USING btree ("recovery_case_id","recovery_date");

-- ============================================================
-- RECUPERACIÓN
-- BACKFILL DE ACCIONES YA EJECUTADAS
-- ============================================================

INSERT INTO public.recovery_cases
(
  company_id,
  tracking_action_id,
  inventory_item_id,
  recommendation_action,

  initial_stock_quantity,
  initial_unit_cost,
  initial_stock_value,

  potential_recoverable_value,

  status,

  started_at,

  created_by,

  created_at,
  updated_at
)
SELECT
  ta.company_id,

  ta.id,

  ta.inventory_item_id,

  ta.recommendation_action,

  ta.stock_quantity,

  ta.unit_cost,

  ta.stock_value,

  ROUND(
    (
      ta.stock_value
      *
      ta.potential_rotation_percentage
      /
      100
    )::numeric,
    4
  ),

  'pending'::recovery_case_status,

  COALESCE(
    ta.executed_at,
    ta.recommendation_date
  ),

  COALESCE(
    ta.executed_by,
    ta.created_by
  ),

  NOW(),

  NOW()

FROM public.tracking_actions ta

WHERE
  ta.status = 'executed'

ON CONFLICT (
  tracking_action_id
)
DO NOTHING;

--> statement-breakpoint


-- ============================================================
-- RLS RECOVERY CASES
-- ============================================================

ALTER TABLE
public.recovery_cases
ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint


REVOKE ALL
ON TABLE
public.recovery_cases
FROM anon;

--> statement-breakpoint


REVOKE ALL
ON TABLE
public.recovery_cases
FROM authenticated;

--> statement-breakpoint


GRANT SELECT
ON TABLE
public.recovery_cases
TO authenticated;

--> statement-breakpoint


DROP POLICY IF EXISTS
"recovery_cases_select_scope"
ON public.recovery_cases;

--> statement-breakpoint


CREATE POLICY
"recovery_cases_select_scope"

ON public.recovery_cases

FOR SELECT

TO authenticated

USING
(
  (
    SELECT
      private.is_admin()
  )

  OR

  company_id =
  (
    SELECT
      private.current_company_id()
  )
);

--> statement-breakpoint


-- ============================================================
-- RLS RECOVERY EVENTS
-- ============================================================

ALTER TABLE
public.recovery_events
ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint


REVOKE ALL
ON TABLE
public.recovery_events
FROM anon;

--> statement-breakpoint


REVOKE ALL
ON TABLE
public.recovery_events
FROM authenticated;

--> statement-breakpoint


GRANT SELECT
ON TABLE
public.recovery_events
TO authenticated;

--> statement-breakpoint


DROP POLICY IF EXISTS
"recovery_events_select_scope"
ON public.recovery_events;

--> statement-breakpoint


CREATE POLICY
"recovery_events_select_scope"

ON public.recovery_events

FOR SELECT

TO authenticated

USING
(
  (
    SELECT
      private.is_admin()
  )

  OR

  company_id =
  (
    SELECT
      private.current_company_id()
  )
);