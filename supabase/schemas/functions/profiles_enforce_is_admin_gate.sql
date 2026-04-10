-- Prevents clients from setting or toggling profiles.is_admin; allows service_role JWT and direct postgres sessions (SQL editor / migrations).
-- Canonical definition; keep in sync with the migration that applies it.

CREATE OR REPLACE FUNCTION public.profiles_enforce_is_admin_gate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  jwt_role text := nullif(current_setting('request.jwt.claim.role', true), '');
  privileged boolean :=
    COALESCE(jwt_role = 'service_role', false)
    OR current_user IN ('postgres', 'supabase_admin');
BEGIN
  IF tg_op = 'INSERT' THEN
    IF new.is_admin IS TRUE AND NOT privileged THEN
      new.is_admin := false;
    END IF;
    RETURN new;
  END IF;

  IF tg_op = 'UPDATE' AND new.is_admin IS DISTINCT FROM old.is_admin AND NOT privileged THEN
    RAISE EXCEPTION 'profiles.is_admin cannot be changed by this role'
      USING ERRCODE = '42501';
  END IF;

  RETURN new;
END;
$$;

ALTER FUNCTION public.profiles_enforce_is_admin_gate() OWNER TO postgres;

DROP TRIGGER IF EXISTS profiles_enforce_is_admin_gate ON public.profiles;

CREATE TRIGGER profiles_enforce_is_admin_gate
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_enforce_is_admin_gate();
