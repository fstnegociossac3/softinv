CREATE TYPE "public"."inventory_import_row_status" AS ENUM('pending', 'valid', 'invalid', 'duplicate');--> statement-breakpoint
CREATE TYPE "public"."inventory_import_source" AS ENUM('xlsx', 'xls', 'csv');--> statement-breakpoint
CREATE TYPE "public"."inventory_import_status" AS ENUM('uploaded', 'validating', 'ready', 'processed', 'failed');--> statement-breakpoint
CREATE TABLE "inventory_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"created_by" uuid,
	"original_file_name" varchar(255) NOT NULL,
	"source_type" "inventory_import_source" NOT NULL,
	"sheet_name" varchar(150),
	"status" "inventory_import_status" DEFAULT 'uploaded' NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"valid_rows" integer DEFAULT 0 NOT NULL,
	"invalid_rows" integer DEFAULT 0 NOT NULL,
	"duplicate_rows" integer DEFAULT 0 NOT NULL,
	"headers" jsonb NOT NULL,
	"column_mapping" jsonb,
	"error_summary" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "inventory_import_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"raw_data" jsonb NOT NULL,
	"normalized_data" jsonb,
	"status" "inventory_import_row_status" DEFAULT 'pending' NOT NULL,
	"errors" jsonb,
	"fingerprint" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_imports" ADD CONSTRAINT "inventory_imports_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_imports" ADD CONSTRAINT "inventory_imports_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_import_rows" ADD CONSTRAINT "inventory_import_rows_import_id_inventory_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."inventory_imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_import_rows" ADD CONSTRAINT "inventory_import_rows_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_imports_company_idx" ON "inventory_imports" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "inventory_imports_created_by_idx" ON "inventory_imports" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "inventory_imports_status_idx" ON "inventory_imports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inventory_imports_created_at_idx" ON "inventory_imports" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_import_rows_import_row_unique" ON "inventory_import_rows" USING btree ("import_id","row_number");--> statement-breakpoint
CREATE INDEX "inventory_import_rows_import_idx" ON "inventory_import_rows" USING btree ("import_id");--> statement-breakpoint
CREATE INDEX "inventory_import_rows_company_idx" ON "inventory_import_rows" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "inventory_import_rows_status_idx" ON "inventory_import_rows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inventory_import_rows_fingerprint_idx" ON "inventory_import_rows" USING btree ("fingerprint");