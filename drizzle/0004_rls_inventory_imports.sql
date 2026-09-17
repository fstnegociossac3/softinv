-- Custom SQL migration file, put your code below! --ALTER TABLE public.inventory_imports
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inventory_import_rows ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint
REVOKE ALL ON TABLE public.inventory_imports
FROM
    anon;

REVOKE ALL ON TABLE public.inventory_import_rows
FROM
    anon;

--> statement-breakpoint
REVOKE ALL ON TABLE public.inventory_imports
FROM
    authenticated;

REVOKE ALL ON TABLE public.inventory_import_rows
FROM
    authenticated;

--> statement-breakpoint
GRANT
SELECT
    ON TABLE public.inventory_imports TO authenticated;

GRANT
SELECT
    ON TABLE public.inventory_import_rows TO authenticated;

--> statement-breakpoint
CREATE POLICY "inventory_imports_select_scope" ON public.inventory_imports FOR
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

--> statement-breakpoint
CREATE POLICY "inventory_import_rows_select_scope" ON public.inventory_import_rows FOR
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