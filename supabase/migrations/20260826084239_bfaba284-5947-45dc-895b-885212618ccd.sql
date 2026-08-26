CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.has_role(UUID, public.app_role) SET SCHEMA private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(UUID, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_my_portal_context()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  phone TEXT,
  role public.app_role,
  doctor_status public.doctor_approval_status
)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.phone, ur.role, dp.approval_status
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.doctor_profiles dp ON dp.user_id = p.id
  WHERE p.id = auth.uid()
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_my_portal_context() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_portal_context() TO authenticated;