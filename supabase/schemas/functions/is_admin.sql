-- Helper for admin checks (RPC guards, RLS on profiles). SECURITY INVOKER: respects RLS on profiles.
-- Canonical definition; keep in sync with the migration that applies it.

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
      AND is_admin = true
  );
$$;

ALTER FUNCTION public.is_admin(uuid) OWNER TO postgres;

COMMENT ON FUNCTION public.is_admin(uuid) IS
  'Returns true when profiles.is_admin is true for the given user id (typically auth.uid()). Used by admin read RPCs (lotteries, missions) and RLS.';

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;
