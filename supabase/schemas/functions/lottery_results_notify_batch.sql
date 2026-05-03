-- Phase C (SQL) : run + finalisation. Miroir : 20260513130000_lottery_results_notify_batch.sql
-- + 20260515120000_lottery_results_notify_start_batch_skip_locked.sql (FOR UPDATE SKIP LOCKED)
-- + 20260514100000_lottery_results_notify_finalize_run_returns_jsonb.sql (alignement remote).

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

DROP FUNCTION IF EXISTS public.lottery_results_notify_finalize_run(uuid);

CREATE FUNCTION public.lottery_results_notify_finalize_run(p_run_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items integer := 0;
  v_runs integer := 0;
  v_run_found boolean := false;
BEGIN
  IF p_run_id IS NULL THEN
    RAISE WARNING
      'lottery_results_notify_finalize_run: p_run_id is null (public.lottery_results_notify_run_items / public.lottery_results_notify_runs unchanged)';
    RETURN jsonb_build_object(
      'run_id', NULL,
      'affected_items_count', 0,
      'updated_runs_count', 0,
      'run_found', false,
      'no_op', true
    );
  END IF;

  SELECT EXISTS (
      SELECT 1
      FROM public.lottery_results_notify_runs r
      WHERE r.id = p_run_id
    )
  INTO v_run_found;

  UPDATE public.lottery_results_notify_run_items
  SET
    status = 'completed',
    updated_at = now()
  WHERE run_id = p_run_id
    AND status = 'pending';
  GET DIAGNOSTICS v_items = ROW_COUNT;

  UPDATE public.lottery_results_notify_runs
  SET finished_at = now()
  WHERE id = p_run_id
    AND finished_at IS NULL;
  GET DIAGNOSTICS v_runs = ROW_COUNT;

  IF v_items = 0 AND v_runs = 0 THEN
    IF v_run_found THEN
      RAISE WARNING
        'lottery_results_notify_finalize_run: zero rows updated for p_run_id % (public.lottery_results_notify_run_items pending=0, public.lottery_results_notify_runs already finalized or unchanged)',
        p_run_id;
    ELSE
      RAISE WARNING
        'lottery_results_notify_finalize_run: zero rows updated, p_run_id % not found in public.lottery_results_notify_runs',
        p_run_id;
    END IF;
  ELSIF v_items > 0 AND v_runs = 0 THEN
    RAISE WARNING
      'lottery_results_notify_finalize_run: % public.lottery_results_notify_run_items updated but public.lottery_results_notify_runs not updated (p_run_id %, run may already be finalized)',
      v_items,
      p_run_id;
  END IF;

  RETURN jsonb_build_object(
    'run_id', to_jsonb(p_run_id),
    'affected_items_count', v_items,
    'updated_runs_count', v_runs,
    'run_found', v_run_found,
    'no_op', (v_items = 0 AND v_runs = 0)
  );
END;
$$;

ALTER FUNCTION public.lottery_results_notify_finalize_run(uuid) OWNER TO postgres;

COMMENT ON FUNCTION public.lottery_results_notify_finalize_run(uuid) IS
  'Finalise une vague de notifications « résultats » (items → completed, run → finished_at). Retourne affected_items_count, updated_runs_count, run_found, no_op.';

REVOKE ALL ON FUNCTION public.lottery_results_notify_finalize_run(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lottery_results_notify_finalize_run(uuid) TO service_role;
