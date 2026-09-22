-- ============================================================
-- 0007_large_bishop.sql
-- PASO 11 - ESTRUCTURA DE INVENTARIO
-- ============================================================


-- ============================================================
-- 1. INVENTORY ITEMS
-- Nuevos campos
-- ============================================================

ALTER TABLE public.inventory_items
ADD COLUMN "stock_value" numeric(18, 4) DEFAULT 0 NOT NULL;

--> statement-breakpoint

ALTER TABLE public.inventory_items
ADD COLUMN "location" varchar(200);

--> statement-breakpoint


-- ============================================================
-- 2. ÍNDICES NUEVOS DE INVENTORY ITEMS
-- ============================================================

CREATE INDEX "inventory_items_category_idx"
ON public.inventory_items
USING btree ("category");

--> statement-breakpoint

CREATE INDEX "inventory_items_brand_idx"
ON public.inventory_items
USING btree ("brand");

--> statement-breakpoint


-- ============================================================
-- 3. VALIDACIÓN STOCK VALUE
-- ============================================================

ALTER TABLE public.inventory_items
ADD CONSTRAINT "inventory_items_stock_value_nonnegative"
CHECK ("stock_value" >= 0);

--> statement-breakpoint


-- ============================================================
-- 4. CALCULAR STOCK VALUE DE REGISTROS EXISTENTES
--
-- stock_value = stock_quantity * unit_cost
-- ============================================================

UPDATE public.inventory_items
SET stock_value = ROUND(
  (
    COALESCE(stock_quantity, 0)
    *
    COALESCE(unit_cost, 0)
  )::numeric,
  4
);

--> statement-breakpoint


-- ============================================================
-- 5. FUNCIÓN PARA SINCRONIZAR STOCK VALUE
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_inventory_stock_value()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN

  NEW.stock_value :=
    ROUND(
      (
        COALESCE(NEW.stock_quantity, 0)
        *
        COALESCE(NEW.unit_cost, 0)
      )::numeric,
      4
    );

  RETURN NEW;

END;
$$;

--> statement-breakpoint


-- ============================================================
-- 6. TRIGGER STOCK VALUE
--
-- Evita que stock_value quede desactualizado.
-- Se recalcula automáticamente en INSERT y UPDATE.
-- ============================================================

DROP TRIGGER IF EXISTS inventory_items_sync_stock_value
ON public.inventory_items;

--> statement-breakpoint

CREATE TRIGGER inventory_items_sync_stock_value
BEFORE INSERT OR UPDATE
ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.sync_inventory_stock_value();

--> statement-breakpoint


-- ============================================================
-- 7. INVENTORY MOVEMENTS
-- ============================================================

CREATE TABLE public.inventory_movements (
  "id" uuid
    PRIMARY KEY
    DEFAULT gen_random_uuid()
    NOT NULL,

  "company_id" uuid
    NOT NULL,

  "inventory_item_id" uuid
    NOT NULL,

  "movement_type" varchar(30)
    NOT NULL,

  "quantity" numeric(18, 4)
    NOT NULL,

  "movement_date" timestamp with time zone
    NOT NULL,

  "created_at" timestamp with time zone
    DEFAULT now()
    NOT NULL,

  CONSTRAINT "inventory_movements_quantity_positive"
    CHECK ("quantity" > 0)
);

--> statement-breakpoint


-- ============================================================
-- 8. FOREIGN KEY - EMPRESA
-- ============================================================

ALTER TABLE public.inventory_movements
ADD CONSTRAINT "inventory_movements_company_id_companies_id_fk"
FOREIGN KEY ("company_id")
REFERENCES public.companies("id")
ON DELETE restrict
ON UPDATE no action;

--> statement-breakpoint


-- ============================================================
-- 9. FOREIGN KEY - PRODUCTO
-- ============================================================

ALTER TABLE public.inventory_movements
ADD CONSTRAINT "inventory_movements_inventory_item_id_inventory_items_id_fk"
FOREIGN KEY ("inventory_item_id")
REFERENCES public.inventory_items("id")
ON DELETE cascade
ON UPDATE no action;

--> statement-breakpoint


-- ============================================================
-- 10. ÍNDICES INVENTORY MOVEMENTS
-- ============================================================

CREATE INDEX "inventory_movements_company_idx"
ON public.inventory_movements
USING btree ("company_id");

--> statement-breakpoint

CREATE INDEX "inventory_movements_item_idx"
ON public.inventory_movements
USING btree ("inventory_item_id");

--> statement-breakpoint

CREATE INDEX "inventory_movements_date_idx"
ON public.inventory_movements
USING btree ("movement_date");

--> statement-breakpoint

CREATE INDEX "inventory_movements_type_idx"
ON public.inventory_movements
USING btree ("movement_type");

--> statement-breakpoint

CREATE INDEX "inventory_movements_item_date_idx"
ON public.inventory_movements
USING btree (
  "inventory_item_id",
  "movement_date"
);

--> statement-breakpoint


-- ============================================================
-- 11. ROW LEVEL SECURITY
-- INVENTORY MOVEMENTS
-- ============================================================

ALTER TABLE public.inventory_movements
ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint


-- ============================================================
-- 12. BLOQUEAR ACCESO ANÓNIMO
-- ============================================================

REVOKE ALL
ON TABLE public.inventory_movements
FROM anon;

--> statement-breakpoint


-- ============================================================
-- 13. RESTRINGIR AUTHENTICATED
-- Luego habilitamos únicamente SELECT.
-- ============================================================

REVOKE ALL
ON TABLE public.inventory_movements
FROM authenticated;

--> statement-breakpoint

GRANT SELECT
ON TABLE public.inventory_movements
TO authenticated;

--> statement-breakpoint


-- ============================================================
-- 14. POLÍTICA MULTIEMPRESA
--
-- ADMIN:
-- Puede visualizar movimientos de todas las empresas.
--
-- USER:
-- Solamente movimientos de su empresa.
-- ============================================================

DROP POLICY IF EXISTS "inventory_movements_select_scope"
ON public.inventory_movements;

--> statement-breakpoint

CREATE POLICY "inventory_movements_select_scope"
ON public.inventory_movements
FOR SELECT
TO authenticated
USING (
  (SELECT private.is_admin())
  OR
  company_id = (
    SELECT private.current_company_id()
  )
);