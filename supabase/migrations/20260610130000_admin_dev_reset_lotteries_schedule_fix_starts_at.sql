-- Ensure admin_dev_reset_lotteries_schedule always satisfies lotteries_dates_are_valid.
-- Preserving starts_at from recently created lotteries could leave starts_at >= new_ends_at
-- when the "past" branch assigns ends_at = now() - 2 days.

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
    WHERE status NOT IN ('drawn'::public.lottery_status, 'cancelled'::public.lottery_status)
  ),
  schedule AS (
    SELECT
      l.id,
      CASE
        WHEN d.r < 0.7 THEN now() + interval '20 days'
        WHEN d.r < 0.9 THEN now() + interval '2 days'
        ELSE now() - interval '2 days'
      END AS new_ends_at,
      CASE
        WHEN d.r < 0.7 THEN now() + interval '21 days'
        WHEN d.r < 0.9 THEN now() + interval '3 days'
        ELSE now() - interval '1 day'
      END AS new_draw_at
    FROM lottery_distribution d
    JOIN public.lotteries l ON l.id = d.id
  ),
  schedule_with_starts AS (
    SELECT
      s.id,
      LEAST(
        COALESCE(l.starts_at, s.new_ends_at - interval '2 days'),
        s.new_ends_at - interval '1 second'
      ) AS new_starts_at,
      s.new_ends_at,
      s.new_draw_at
    FROM schedule s
    JOIN public.lotteries l ON l.id = s.id
  )
  UPDATE public.lotteries AS l
  SET
    starts_at = s.new_starts_at,
    ends_at = s.new_ends_at,
    draw_at = s.new_draw_at,
    status = CASE
      WHEN s.new_ends_at > now() THEN 'active'::public.lottery_status
      ELSE 'closed'::public.lottery_status
    END,
    updated_at = now()
  FROM schedule_with_starts s
  WHERE l.id = s.id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

COMMENT ON FUNCTION public.admin_dev_reset_lotteries_schedule() IS
  'Temporary dev-only admin action: randomize starts_at/ends_at/draw_at and align status (active if ends_at > now(), else closed) for lotteries except drawn/cancelled.';
