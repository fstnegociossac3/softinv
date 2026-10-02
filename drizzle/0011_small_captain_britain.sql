CREATE TYPE "public"."report_type" AS ENUM (
	'executive',
	'critical_inventory',
	'recommendations',
	'recovery'
);

--> statement-breakpoint
CREATE TABLE
	"reports" (
		"id" uuid PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
		"company_id" uuid NOT NULL,
		"report_type" "report_type" NOT NULL,
		"date_from" date NOT NULL,
		"date_to" date NOT NULL,
		"snapshot_data" jsonb NOT NULL,
		"snapshot_version" integer DEFAULT 1 NOT NULL,
		"generated_by" uuid NOT NULL,
		"generated_at" timestamp
		with
			time zone DEFAULT now () NOT NULL,
			CONSTRAINT "reports_date_range_check" CHECK ("reports"."date_from" <= "reports"."date_to")
	);

--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies" ("id") ON DELETE restrict ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_profiles_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."profiles" ("id") ON DELETE restrict ON UPDATE no action;

--> statement-breakpoint
CREATE INDEX "reports_company_idx" ON "reports" USING btree ("company_id");

--> statement-breakpoint
CREATE INDEX "reports_type_idx" ON "reports" USING btree ("report_type");

--> statement-breakpoint
CREATE INDEX "reports_generated_by_idx" ON "reports" USING btree ("generated_by");

--> statement-breakpoint
CREATE INDEX "reports_generated_at_idx" ON "reports" USING btree ("generated_at");

--> statement-breakpoint
CREATE INDEX "reports_company_generated_idx" ON "reports" USING btree ("company_id", "generated_at");

--> statement-breakpoint
CREATE INDEX "reports_company_type_generated_idx" ON "reports" USING btree ("company_id", "report_type", "generated_at");

-- ============================================================
-- REPORTES
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint
-- ============================================================
-- ANON
-- ============================================================
REVOKE ALL ON TABLE public.reports
FROM
	anon;

--> statement-breakpoint
-- ============================================================
-- AUTHENTICATED
-- ============================================================
REVOKE ALL ON TABLE public.reports
FROM
	authenticated;

--> statement-breakpoint
/*
 * El cliente solamente puede leer.
 *
 * La generación se realiza desde
 * backend mediante Drizzle.
 */
GRANT
SELECT
	ON TABLE public.reports TO authenticated;

--> statement-breakpoint
-- ============================================================
-- POLICY
-- ============================================================
DROP POLICY IF EXISTS "reports_select_scope" ON public.reports;

--> statement-breakpoint
CREATE POLICY "reports_select_scope" ON public.reports FOR
SELECT
	TO authenticated USING (
		(
			SELECT
				private.is_admin ()
		)
		OR company_id = (
			SELECT
				private.current_company_id ()
		)
	);