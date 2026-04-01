CREATE OR REPLACE FUNCTION public.get_user_active_ticket_counts_by_lottery(
  p_lottery_ids uuid[]
)
RETURNS TABLE (
  lottery_id uuid,
  active_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: you must be logged in';
  END IF;

  RETURN QUERY
  WITH input_ids AS (
    SELECT DISTINCT unnest(p_lottery_ids) AS lottery_id
  )
  SELECT
    input_ids.lottery_id,
    COUNT(lt.id)::bigint AS active_count
  FROM input_ids
  LEFT JOIN public.lottery_tickets lt
    ON lt.lottery_id = input_ids.lottery_id
   AND lt.status = 'active'
   AND lt.user_id = v_uid
  GROUP BY input_ids.lottery_id;
END;
$$;

ALTER FUNCTION public.get_user_active_ticket_counts_by_lottery(uuid[]) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.get_user_active_ticket_counts_by_lottery(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_active_ticket_counts_by_lottery(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_active_ticket_counts_by_lottery(uuid[]) TO service_role;
