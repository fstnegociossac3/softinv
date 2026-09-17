ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inventory_item_snapshots ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.inventory_items
FROM
    anon;

REVOKE ALL ON TABLE public.inventory_item_snapshots
FROM
    anon;

REVOKE ALL ON TABLE public.inventory_items
FROM
    authenticated;

REVOKE ALL ON TABLE public.inventory_item_snapshots
FROM
    authenticated;

GRANT
SELECT
    ON TABLE public.inventory_items TO authenticated;

GRANT
SELECT
    ON TABLE public.inventory_item_snapshots TO authenticated;

CREATE POLICY "inventory_items_select_scope" ON public.inventory_items FOR
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

CREATE POLICY "inventory_snapshots_select_scope" ON public.inventory_item_snapshots FOR
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