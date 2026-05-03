-- lottery_results_notify_start_batch : évite la course sur v_ids entre appels concurrents
-- en verrouillant les lignes public.lotteries sélectionnées (FOR UPDATE SKIP LOCKED)
-- avant insertion dans lottery_results_notify_run_items.

CREATE OR REPLACE FUNCTION public.lottery_results_notify_start_batch(p_max integer DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run_id uuid;
  v_ids uuid[];
  v_lim integer := greatest(1, least(coalesce(p_max, 50), 500));
BEGIN
  SELECT coalesce(
    (
      SELECT array_agg(sub.id ORDER BY sub.updated_at, sub.id)
      FROM (
        SELECT l.id, l.updated_at
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
        LIMIT v_lim
        FOR UPDATE OF l SKIP LOCKED
      ) sub
    ),
    ARRAY[]::uuid[]
  )
  INTO v_ids;

  IF cardinality(v_ids) = 0 THEN
    RETURN jsonb_build_object('run_id', NULL, 'lottery_ids', '[]'::jsonb);
  END IF;

  INSERT INTO public.lottery_results_notify_runs DEFAULT VALUES
  RETURNING id INTO v_run_id;

  INSERT INTO public.lottery_results_notify_run_items (run_id, lottery_id, status)
  SELECT v_run_id, u, 'pending'::text
  FROM unnest(v_ids) AS u;

  RETURN jsonb_build_object(
    'run_id', to_jsonb(v_run_id),
    'lottery_ids', to_jsonb(v_ids)
  );
END;
$$;

ALTER FUNCTION public.lottery_results_notify_start_batch(integer) OWNER TO postgres;

COMMENT ON FUNCTION public.lottery_results_notify_start_batch(integer) IS
  'Crée lottery_results_notify_runs + run_items pending pour un lot de loteries drawn éligibles.';

REVOKE ALL ON FUNCTION public.lottery_results_notify_start_batch(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lottery_results_notify_start_batch(integer) TO service_role;
