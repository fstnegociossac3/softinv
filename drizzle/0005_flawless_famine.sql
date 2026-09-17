CREATE TYPE "public"."inventory_item_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"sku" varchar(100) NOT NULL,
	"sku_normalized" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(150),
	"brand" varchar(150),
	"stock_quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"unit_cost" numeric(18, 4) DEFAULT 0 NOT NULL,
	"last_movement_date" timestamp with time zone,
	"sales_30d" numeric(18, 4) DEFAULT 0 NOT NULL,
	"sales_90d" numeric(18, 4) DEFAULT 0 NOT NULL,
	"sales_180d" numeric(18, 4) DEFAULT 0 NOT NULL,
	"last_import_id" uuid,
	"status" "inventory_item_status" DEFAULT 'active' NOT NULL,
	"last_imported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_items_stock_nonnegative" CHECK (
          "inventory_items"."stock_quantity"
          >= 0
        ),
	CONSTRAINT "inventory_items_cost_nonnegative" CHECK (
          "inventory_items"."unit_cost"
          >= 0
        ),
	CONSTRAINT "inventory_items_sales_30d_nonnegative" CHECK (
          "inventory_items"."sales_30d"
          >= 0
        ),
	CONSTRAINT "inventory_items_sales_90d_nonnegative" CHECK (
          "inventory_items"."sales_90d"
          >= 0
        ),
	CONSTRAINT "inventory_items_sales_180d_nonnegative" CHECK (
          "inventory_items"."sales_180d"
          >= 0
        )
);
--> statement-breakpoint
CREATE TABLE "inventory_item_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"import_id" uuid,
	"import_row_id" uuid,
	"stock_quantity" numeric(18, 4) NOT NULL,
	"unit_cost" numeric(18, 4) NOT NULL,
	"last_movement_date" timestamp with time zone,
	"sales_30d" numeric(18, 4) DEFAULT 0 NOT NULL,
	"sales_90d" numeric(18, 4) DEFAULT 0 NOT NULL,
	"sales_180d" numeric(18, 4) DEFAULT 0 NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_last_import_id_inventory_imports_id_fk" FOREIGN KEY ("last_import_id") REFERENCES "public"."inventory_imports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_item_snapshots" ADD CONSTRAINT "inventory_item_snapshots_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_item_snapshots" ADD CONSTRAINT "inventory_item_snapshots_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_item_snapshots" ADD CONSTRAINT "inventory_item_snapshots_import_id_inventory_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."inventory_imports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_item_snapshots" ADD CONSTRAINT "inventory_item_snapshots_import_row_id_inventory_import_rows_id_fk" FOREIGN KEY ("import_row_id") REFERENCES "public"."inventory_import_rows"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_items_company_sku_unique" ON "inventory_items" USING btree ("company_id","sku_normalized");--> statement-breakpoint
CREATE INDEX "inventory_items_company_idx" ON "inventory_items" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "inventory_items_sku_idx" ON "inventory_items" USING btree ("sku_normalized");--> statement-breakpoint
CREATE INDEX "inventory_items_status_idx" ON "inventory_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inventory_items_company_status_idx" ON "inventory_items" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "inventory_items_last_movement_idx" ON "inventory_items" USING btree ("last_movement_date");--> statement-breakpoint
CREATE INDEX "inventory_items_last_import_idx" ON "inventory_items" USING btree ("last_import_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_snapshots_item_import_unique" ON "inventory_item_snapshots" USING btree ("inventory_item_id","import_id");--> statement-breakpoint
CREATE INDEX "inventory_snapshots_company_idx" ON "inventory_item_snapshots" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "inventory_snapshots_item_idx" ON "inventory_item_snapshots" USING btree ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "inventory_snapshots_import_idx" ON "inventory_item_snapshots" USING btree ("import_id");--> statement-breakpoint
CREATE INDEX "inventory_snapshots_captured_at_idx" ON "inventory_item_snapshots" USING btree ("captured_at");