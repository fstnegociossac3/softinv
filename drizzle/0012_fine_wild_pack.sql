CREATE TABLE "company_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"iri_config" jsonb NOT NULL,
	"recommendation_config" jsonb NOT NULL,
	"traffic_light_config" jsonb NOT NULL,
	"notification_config" jsonb NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "company_settings_company_unique" ON "company_settings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_settings_updated_by_idx" ON "company_settings" USING btree ("updated_by");

-- ============================================================
-- COMPANY SETTINGS
-- ROW LEVEL SECURITY
-- ============================================================


ALTER TABLE public.company_settings
ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint


-- ============================================================
-- ANON
-- ============================================================

REVOKE ALL
ON TABLE public.company_settings
FROM anon;

--> statement-breakpoint


-- ============================================================
-- AUTHENTICATED
-- ============================================================

REVOKE ALL
ON TABLE public.company_settings
FROM authenticated;

--> statement-breakpoint


/*
 * La aplicación puede leer la configuración
 * correspondiente a la empresa.
 *
 * Las actualizaciones se realizan
 * exclusivamente desde backend.
 */
GRANT SELECT
ON TABLE public.company_settings
TO authenticated;

--> statement-breakpoint


-- ============================================================
-- POLICY SELECT
-- ============================================================

DROP POLICY IF EXISTS
"company_settings_select_scope"
ON public.company_settings;

--> statement-breakpoint


CREATE POLICY
"company_settings_select_scope"

ON public.company_settings

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