-- Temporary admin action used only during development.
-- TODO(dev-reset-lotteries): remove before production.

CREATE OR REPLACE FUNCTION public.admin_dev_reset_lotteries_schedule()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_updated integer := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'WINLAB_ADMIN_REQUIRED'
      USING ERRCODE = '42501';
  END IF;

  WITH lottery_distribution AS (
    SELECT
      id,
      random() AS r
    FROM public.lotteries
    WHERE status <> 'drawn'
  )
  UPDATE public.lotteries AS l
  SET
    starts_at = COALESCE(l.starts_at, now() - interval '1 day'),
    ends_at = CASE
      WHEN d.r < 0.7 THEN now() + interval '20 days'
      WHEN d.r < 0.9 THEN now() + interval '2 days'
      ELSE now() - interval '2 days'
    END,
    draw_at = CASE
      WHEN d.r < 0.7 THEN now() + interval '21 days'
      WHEN d.r < 0.9 THEN now() + interval '3 days'
      ELSE now() - interval '1 day'
    END,
    updated_at = now()
  FROM lottery_distribution d
  WHERE l.id = d.id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

ALTER FUNCTION public.admin_dev_reset_lotteries_schedule() OWNER TO postgres;

COMMENT ON FUNCTION public.admin_dev_reset_lotteries_schedule() IS
  'Temporary dev-only admin action: randomize starts_at/ends_at/draw_at for lotteries where status <> drawn.';

REVOKE ALL ON FUNCTION public.admin_dev_reset_lotteries_schedule() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_dev_reset_lotteries_schedule() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dev_reset_lotteries_schedule() TO service_role;
