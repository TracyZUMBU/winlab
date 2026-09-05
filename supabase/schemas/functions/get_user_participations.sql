-- Paginated list of lotteries the authenticated user has tickets on (any ticket status).
-- SECURITY DEFINER: cancelled lotteries are not selectable via RLS for authenticated users;
-- results remain scoped to auth.uid() ticket ownership.

CREATE OR REPLACE FUNCTION public.get_user_participations(
  p_limit integer,
  p_offset integer
)
RETURNS TABLE (
  lottery_id uuid,
  title text,
  image_url text,
  draw_at timestamp with time zone,
  status public.lottery_status,
  user_tickets_count bigint,
  last_participated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();

  -- Empty set when unauthenticated keeps list UIs simple (empty state).
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION 'p_limit must be between 1 and 100';
  END IF;

  IF p_offset IS NULL OR p_offset < 0 THEN
    RAISE EXCEPTION 'p_offset must be >= 0';
  END IF;

  RETURN QUERY
  SELECT
    l.id AS lottery_id,
    l.title,
    l.image_url,
    l.draw_at,
    l.status,
    COUNT(lt.id)::bigint AS user_tickets_count,
    MAX(lt.purchased_at) AS last_participated_at
  FROM public.lottery_tickets lt
  INNER JOIN public.lotteries l ON l.id = lt.lottery_id
  INNER JOIN public.brands b ON b.id = l.brand_id AND b.is_active = true
  WHERE lt.user_id = v_uid
  GROUP BY l.id, l.title, l.image_url, l.draw_at, l.status
  ORDER BY MAX(lt.purchased_at) DESC, l.id ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

ALTER FUNCTION public.get_user_participations(integer, integer) OWNER TO postgres;

COMMENT ON FUNCTION public.get_user_participations(integer, integer) IS
  'Paginated lotteries the current user participated in (any ticket status), ordered by most recent purchase.';

REVOKE ALL ON FUNCTION public.get_user_participations(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_participations(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_participations(integer, integer) TO service_role;
