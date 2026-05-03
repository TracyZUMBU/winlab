-- Phase B : requêtes métier pour la future Edge « résultats loterie » (option A + idempotence v1).
-- Participants = utilisateurs ayant au moins un ticket encore « active » sur une loterie concernée
-- (run_lottery ne change pas le statut des tickets ; seuls active / cancelled existent).

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
  ORDER BY l.updated_at ASC, l.id ASC
  LIMIT greatest(1, least(coalesce(p_max, 200), 2000));
$$;

ALTER FUNCTION public.lottery_drawn_ids_pending_results_push(integer) OWNER TO postgres;

COMMENT ON FUNCTION public.lottery_drawn_ids_pending_results_push(integer) IS
  'Loteries drawn sans ligne notify_run_items en status completed (éligibles à une vague de push « résultats »).';

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
