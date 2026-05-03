-- Aligne run_lottery avec lotteries.ends_at NOT NULL (voir schemas/functions/run_lottery.sql).

DROP FUNCTION IF EXISTS public.run_lottery(uuid);

CREATE OR REPLACE FUNCTION public.run_lottery(p_lottery_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lottery public.lotteries%rowtype;
  v_active_tickets_count integer := 0;
  v_winners_count integer := 0;
  v_winner_ticket_ids uuid[] := ARRAY[]::uuid[];
BEGIN
  SELECT *
  INTO v_lottery
  FROM public.lotteries
  WHERE id = p_lottery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LOTTERY_NOT_FOUND: lottery does not exist';
  END IF;

  IF v_lottery.status = 'drawn' THEN
    RAISE EXCEPTION 'LOTTERY_ALREADY_DRAWN';
  ELSIF v_lottery.status = 'cancelled' THEN
    RAISE EXCEPTION 'LOTTERY_CANCELLED';
  ELSIF v_lottery.status = 'draft' THEN
    RAISE EXCEPTION 'LOTTERY_DRAFT';
  ELSIF v_lottery.status <> 'closed' THEN
    RAISE EXCEPTION 'LOTTERY_NOT_CLOSED';
  END IF;

  IF v_lottery.draw_at > now() THEN
    RAISE EXCEPTION 'LOTTERY_DRAW_NOT_READY';
  END IF;

  IF v_lottery.ends_at > now() THEN
    RAISE EXCEPTION 'LOTTERY_NOT_ENDED';
  END IF;

  SELECT count(*)
  INTO v_active_tickets_count
  FROM public.lottery_tickets lt
  WHERE lt.lottery_id = p_lottery_id
    AND lt.status = 'active'
    AND NOT EXISTS (
      SELECT 1
      FROM public.lottery_winners lw
      WHERE lw.ticket_id = lt.id
    );

  v_winners_count := LEAST(v_active_tickets_count, v_lottery.number_of_winners);

  IF v_winners_count > 0 THEN
    WITH randomly_picked AS (
      SELECT
        lt.id AS ticket_id,
        lt.user_id
      FROM public.lottery_tickets lt
      WHERE lt.lottery_id = p_lottery_id
        AND lt.status = 'active'
        AND NOT EXISTS (
          SELECT 1
          FROM public.lottery_winners lw
          WHERE lw.ticket_id = lt.id
        )
      ORDER BY random()
      LIMIT v_winners_count
    ),
    chosen AS (
      SELECT
        rp.ticket_id,
        rp.user_id,
        row_number() OVER () AS winner_position
      FROM randomly_picked rp
    ),
    ins AS (
      INSERT INTO public.lottery_winners (
        lottery_id,
        ticket_id,
        user_id,
        position
      )
      SELECT
        p_lottery_id,
        c.ticket_id,
        c.user_id,
        c.winner_position
      FROM chosen c
      RETURNING ticket_id, position
    )
    SELECT COALESCE(array_agg(ticket_id ORDER BY position), ARRAY[]::uuid[])
    INTO v_winner_ticket_ids
    FROM ins;
  END IF;

  UPDATE public.lotteries
  SET
    status = 'drawn',
    updated_at = now()
  WHERE id = p_lottery_id;

  RETURN v_winner_ticket_ids;
END;
$$;

ALTER FUNCTION public.run_lottery(uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.run_lottery(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_lottery(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.run_lottery(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.run_lottery(uuid) TO service_role;
