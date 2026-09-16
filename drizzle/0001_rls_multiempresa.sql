CREATE SCHEMA IF NOT EXISTS private;

--> statement-breakpoint

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
      AND p.status = 'active'
  );
$$;

--> statement-breakpoint

CREATE OR REPLACE FUNCTION private.current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT cu.company_id
  FROM public.company_users cu
  INNER JOIN public.profiles p
    ON p.id = cu.user_id
  INNER JOIN public.companies c
    ON c.id = cu.company_id
  WHERE cu.user_id = (SELECT auth.uid())
    AND p.status = 'active'
    AND c.status = 'active'
  LIMIT 1;
$$;

--> statement-breakpoint

REVOKE ALL
ON FUNCTION private.is_admin()
FROM PUBLIC;

REVOKE ALL
ON FUNCTION private.current_company_id()
FROM PUBLIC;

GRANT USAGE ON SCHEMA private
TO authenticated;

GRANT EXECUTE
ON FUNCTION private.is_admin()
TO authenticated;

GRANT EXECUTE
ON FUNCTION private.current_company_id()
TO authenticated;

--> statement-breakpoint

ALTER TABLE public.companies
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.company_users
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.audit_logs
ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint

REVOKE ALL
ON TABLE public.companies
FROM anon;

REVOKE ALL
ON TABLE public.profiles
FROM anon;

REVOKE ALL
ON TABLE public.company_users
FROM anon;

REVOKE ALL
ON TABLE public.audit_logs
FROM anon;

--> statement-breakpoint

REVOKE ALL
ON TABLE public.companies
FROM authenticated;

REVOKE ALL
ON TABLE public.profiles
FROM authenticated;

REVOKE ALL
ON TABLE public.company_users
FROM authenticated;

REVOKE ALL
ON TABLE public.audit_logs
FROM authenticated;

--> statement-breakpoint

GRANT SELECT
ON TABLE public.companies
TO authenticated;

GRANT SELECT
ON TABLE public.profiles
TO authenticated;

GRANT SELECT
ON TABLE public.company_users
TO authenticated;

GRANT SELECT
ON TABLE public.audit_logs
TO authenticated;

--> statement-breakpoint

CREATE POLICY "companies_select_scope"
ON public.companies
FOR SELECT
TO authenticated
USING (
  (SELECT private.is_admin())
  OR
  id = (SELECT private.current_company_id())
);

--> statement-breakpoint

CREATE POLICY "profiles_select_scope"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (SELECT private.is_admin())
  OR
  (
    id = (SELECT auth.uid())
    AND status = 'active'
  )
);

--> statement-breakpoint

CREATE POLICY "company_users_select_scope"
ON public.company_users
FOR SELECT
TO authenticated
USING (
  (SELECT private.is_admin())
  OR
  (
    user_id = (SELECT auth.uid())
    AND company_id =
      (SELECT private.current_company_id())
  )
);

--> statement-breakpoint

CREATE POLICY "audit_logs_admin_select"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  (SELECT private.is_admin())
);