-- Align admin_get_missions_count with admin_get_missions: same INNER JOIN to brands
-- so total count and paginated rows use identical row sets.

CREATE OR REPLACE FUNCTION public.admin_get_missions_count(
  p_title_search text DEFAULT NULL,
  p_brand_id uuid DEFAULT NULL,
  p_status public.mission_status DEFAULT NULL,
  p_mission_type public.mission_type DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_title text;
  v_count bigint;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'WINLAB_ADMIN_REQUIRED'
      USING ERRCODE = '42501';
  END IF;

  v_title := NULLIF(trim(COALESCE(p_title_search, '')), '');

  SELECT COUNT(*)::bigint
  INTO v_count
  FROM public.missions m
  INNER JOIN public.brands b
    ON b.id = m.brand_id
  WHERE (v_title IS NULL OR m.title ILIKE ('%' || v_title || '%'))
    AND (p_brand_id IS NULL OR m.brand_id = p_brand_id)
    AND (p_status IS NULL OR m.status = p_status)
    AND (p_mission_type IS NULL OR m.mission_type = p_mission_type);

  RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON FUNCTION public.admin_get_missions_count(
  text,
  uuid,
  public.mission_status,
  public.mission_type
) IS
  'Backoffice: total rows for admin_get_missions with the same filter params (no pagination), including INNER JOIN brands as the list RPC. Caller must be profiles.is_admin.';
