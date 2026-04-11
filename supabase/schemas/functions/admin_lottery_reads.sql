-- Admin read RPCs for Winlab backoffice (SECURITY DEFINER + explicit admin guard).
-- Legacy SQL views admin_lotteries_overview / admin_lottery_detail were dropped (migration drop_legacy_admin_views).
-- Canonical definitions; keep in sync with the migration that applies them.

CREATE OR REPLACE FUNCTION public.admin_get_lotteries()
RETURNS TABLE (
  lottery_id uuid,
  title text,
  status public.lottery_status,
  starts_at timestamptz,
  ends_at timestamptz,
  draw_at timestamptz,
  ticket_cost integer,
  number_of_winners integer,
  brand_name text,
  tickets_count bigint,
  winners_count bigint
)
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
  SELECT
    l.id AS lottery_id,
    l.title,
    l.status,
    l.starts_at,
    l.ends_at,
    l.draw_at,
    l.ticket_cost,
    l.number_of_winners,
    b.name AS brand_name,
    COALESCE(tc.tickets_count, 0)::bigint AS tickets_count,
    COALESCE(wc.winners_count, 0)::bigint AS winners_count
  FROM public.lotteries l
  LEFT JOIN public.brands b
    ON b.id = l.brand_id
  LEFT JOIN (
    SELECT
      lt.lottery_id,
      COUNT(*)::bigint AS tickets_count
    FROM public.lottery_tickets lt
    GROUP BY lt.lottery_id
  ) tc
    ON tc.lottery_id = l.id
  LEFT JOIN (
    SELECT
      lw.lottery_id,
      COUNT(*)::bigint AS winners_count
    FROM public.lottery_winners lw
    GROUP BY lw.lottery_id
  ) wc
    ON wc.lottery_id = l.id
  ORDER BY l.draw_at DESC;
END;
$$;

ALTER FUNCTION public.admin_get_lotteries() OWNER TO postgres;

COMMENT ON FUNCTION public.admin_get_lotteries() IS
  'Backoffice: list lotteries with ticket/winner counts. Caller must be profiles.is_admin.';

CREATE OR REPLACE FUNCTION public.admin_get_lottery_detail(p_lottery_id uuid)
RETURNS TABLE (
  lottery_id uuid,
  title text,
  description text,
  short_description text,
  status public.lottery_status,
  category text,
  slug text,
  is_featured boolean,
  ticket_cost integer,
  number_of_winners integer,
  starts_at timestamptz,
  ends_at timestamptz,
  draw_at timestamptz,
  brand_name text,
  tickets_count bigint,
  winners_count bigint,
  winners jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'WINLAB_ADMIN_REQUIRED'
      USING ERRCODE = '42501';
  END IF;

  IF p_lottery_id IS NULL THEN
    RAISE EXCEPTION 'WINLAB_INVALID_LOTTERY_ID'
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    l.id AS lottery_id,
    l.title,
    l.description,
    l.short_description,
    l.status,
    l.category,
    l.slug,
    l.is_featured,
    l.ticket_cost,
    l.number_of_winners,
    l.starts_at,
    l.ends_at,
    l.draw_at,
    b.name AS brand_name,
    COALESCE(tc.tickets_count, 0)::bigint AS tickets_count,
    COALESCE(wc.winners_count, 0)::bigint AS winners_count,
    COALESCE(
      wj.winners,
      '[]'::jsonb
    ) AS winners
  FROM public.lotteries l
  LEFT JOIN public.brands b
    ON b.id = l.brand_id
  LEFT JOIN (
    SELECT
      lt.lottery_id,
      COUNT(*)::bigint AS tickets_count
    FROM public.lottery_tickets lt
    GROUP BY lt.lottery_id
  ) tc
    ON tc.lottery_id = l.id
  LEFT JOIN (
    SELECT
      lw.lottery_id,
      COUNT(*)::bigint AS winners_count
    FROM public.lottery_winners lw
    GROUP BY lw.lottery_id
  ) wc
    ON wc.lottery_id = l.id
  LEFT JOIN (
    SELECT
      lw.lottery_id,
      jsonb_agg(
        jsonb_build_object(
          'position', lw.position,
          'user_id', lw.user_id,
          'username', p.username,
          'email', p.email,
          'ticket_id', lw.ticket_id,
          'created_at', lw.created_at
        )
        ORDER BY lw.position ASC
      ) AS winners
    FROM public.lottery_winners lw
    LEFT JOIN public.profiles p
      ON p.id = lw.user_id
    GROUP BY lw.lottery_id
  ) wj
    ON wj.lottery_id = l.id
  WHERE l.id = p_lottery_id;
END;
$$;

ALTER FUNCTION public.admin_get_lottery_detail(uuid) OWNER TO postgres;

COMMENT ON FUNCTION public.admin_get_lottery_detail(uuid) IS
  'Backoffice: one lottery row with JSON winners. Caller must be profiles.is_admin; empty set if id unknown.';

REVOKE ALL ON FUNCTION public.admin_get_lotteries() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_lotteries() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_lotteries() TO service_role;

REVOKE ALL ON FUNCTION public.admin_get_lottery_detail(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_lottery_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_lottery_detail(uuid) TO service_role;
