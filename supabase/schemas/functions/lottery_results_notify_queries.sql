-- Phase B : helpers pour la Edge « résultats loterie » (voir migration 20260513120400).

CREATE OR REPLACE FUNCTION public.lottery_drawn_ids_pending_results_push(p_max integer DEFAULT 200)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.id
  FROM public.lotteries l
  WHERE l.status = 'drawn'::public.lottery_status
    AND NOT EXISTS (
      SELECT 1
      FROM public.lottery_results_notify_run_items i
      WHERE i.lottery_id = l.id
        AND i.status = 'completed'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.lottery_results_notify_run_items i2
      INNER JOIN public.lottery_results_notify_runs r2 ON r2.id = i2.run_id
      WHERE i2.lottery_id = l.id
        AND i2.status = 'pending'
        AND r2.finished_at IS NULL
    )
  ORDER BY l.updated_at ASC, l.id ASC
  LIMIT greatest(1, least(coalesce(p_max, 200), 2000));
$$;

ALTER FUNCTION public.lottery_drawn_ids_pending_results_push(integer) OWNER TO postgres;

COMMENT ON FUNCTION public.lottery_drawn_ids_pending_results_push(integer) IS
  'Loteries drawn sans notify completed, et sans lot pending dans un run non finalisé.';

REVOKE ALL ON FUNCTION public.lottery_drawn_ids_pending_results_push(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lottery_drawn_ids_pending_results_push(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.lottery_results_notify_distinct_participant_user_ids(
  p_lottery_ids uuid[]
)
RETURNS TABLE (user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT lt.user_id
  FROM public.lottery_tickets lt
  WHERE lt.lottery_id = ANY (p_lottery_ids)
    AND lt.status = 'active'::public.lottery_ticket_status;
$$;

ALTER FUNCTION public.lottery_results_notify_distinct_participant_user_ids(uuid[]) OWNER TO postgres;

COMMENT ON FUNCTION public.lottery_results_notify_distinct_participant_user_ids(uuid[]) IS
  'Utilisateurs distincts avec au moins un ticket active sur les loteries données (cible push agrégée).';

REVOKE ALL ON FUNCTION public.lottery_results_notify_distinct_participant_user_ids(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lottery_results_notify_distinct_participant_user_ids(uuid[]) TO service_role;
