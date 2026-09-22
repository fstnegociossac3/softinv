DROP INDEX "inventory_snapshots_captured_at_idx";--> statement-breakpoint
DROP INDEX "inventory_movements_item_date_idx";--> statement-breakpoint
DROP INDEX "inventory_items_company_status_idx";--> statement-breakpoint
CREATE INDEX "inventory_snapshots_company_captured_item_idx" ON "inventory_item_snapshots" USING btree ("company_id","captured_at","inventory_item_id");--> statement-breakpoint
CREATE INDEX "inventory_movements_company_date_item_idx" ON "inventory_movements" USING btree ("company_id","movement_date","inventory_item_id");--> statement-breakpoint
CREATE INDEX "inventory_items_company_status_idx" ON "inventory_items" USING btree ("company_id","status","last_movement_date");