-- Distinct lottery categories for admin create form (SECURITY DEFINER + is_admin guard).

CREATE OR REPLACE FUNCTION public.admin_get_lottery_categories()
RETURNS TABLE (category text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'WINLAB_ADMIN_REQUIRED'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT DISTINCT lower(btrim(l.category)) AS category
  FROM public.lotteries l
  WHERE l.category IS NOT NULL
    AND char_length(btrim(l.category)) > 0
  ORDER BY lower(btrim(l.category)) ASC;
END;
$$;

ALTER FUNCTION public.admin_get_lottery_categories() OWNER TO postgres;

COMMENT ON FUNCTION public.admin_get_lottery_categories() IS
  'Backoffice: distinct non-empty lotteries.category values (trimmed, lowercased) for create-form select. Caller must be profiles.is_admin.';

REVOKE ALL ON FUNCTION public.admin_get_lottery_categories() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_lottery_categories() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_lottery_categories() TO service_role;
