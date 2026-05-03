DROP FUNCTION IF EXISTS public.run_lottery(uuid);

CREATE OR REPLACE FUNCTION public.run_lottery(p_lottery_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Lottery row locked for the whole transaction to avoid concurrent draws.
  v_lottery public.lotteries%rowtype;

  -- Number of active and eligible tickets for this lottery.
  -- "Eligible" here means:
  --   - ticket belongs to the lottery
  --   - ticket status = 'active'
  --   - ticket is not already present in lottery_winners
  v_active_tickets_count integer := 0;

  -- Final number of winners to draw:
  -- min(eligible tickets count, configured number_of_winners)
  v_winners_count integer := 0;

  -- Returned value: ordered list of winning ticket ids.
  v_winner_ticket_ids uuid[] := ARRAY[]::uuid[];
BEGIN
  ---------------------------------------------------------------------------
  -- 1) Load and lock the lottery row
  --
  -- FOR UPDATE ensures that two concurrent calls cannot draw the same lottery
  -- at the same time.
  ---------------------------------------------------------------------------
  SELECT *
  INTO v_lottery
  FROM public.lotteries
  WHERE id = p_lottery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LOTTERY_NOT_FOUND: lottery does not exist';
  END IF;

  ---------------------------------------------------------------------------
  -- 2) Validate lottery status
  --
  -- Product rule:
  -- - a lottery must be explicitly closed before it can be drawn
  -- - drawn/cancelled/draft lotteries cannot be drawn
  ---------------------------------------------------------------------------
  IF v_lottery.status = 'drawn' THEN
    RAISE EXCEPTION 'LOTTERY_ALREADY_DRAWN';
  ELSIF v_lottery.status = 'cancelled' THEN
    RAISE EXCEPTION 'LOTTERY_CANCELLED';
  ELSIF v_lottery.status = 'draft' THEN
    RAISE EXCEPTION 'LOTTERY_DRAFT';
  ELSIF v_lottery.status <> 'closed' THEN
    RAISE EXCEPTION 'LOTTERY_NOT_CLOSED';
  END IF;

  ---------------------------------------------------------------------------
  -- 3) Validate lottery timing
  --
  -- The draw can only happen when:
  -- - draw_at <= now()
  -- - ends_at <= now() (ends_at is NOT NULL on lotteries)
  ---------------------------------------------------------------------------
  IF v_lottery.draw_at > now() THEN
    RAISE EXCEPTION 'LOTTERY_DRAW_NOT_READY';
  END IF;

  IF v_lottery.ends_at > now() THEN
    RAISE EXCEPTION 'LOTTERY_NOT_ENDED';
  END IF;

  ---------------------------------------------------------------------------
  -- 4) Count active and eligible tickets
  --
  -- We explicitly exclude tickets already present in lottery_winners.
  -- This makes the function more robust against inconsistent data or partial
  -- test states, even though a normal production flow should only draw once.
  ---------------------------------------------------------------------------
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

  ---------------------------------------------------------------------------
  -- 5) Compute how many winners we can actually create
  --
  -- If there are fewer eligible tickets than configured winners,
  -- we only draw the number of tickets available.
  ---------------------------------------------------------------------------
  v_winners_count := LEAST(v_active_tickets_count, v_lottery.number_of_winners);

  ---------------------------------------------------------------------------
  -- 6) Draw winners and insert them
  --
  -- We preserve the real random draw order:
  -- - first subquery randomly selects the winning tickets
  -- - second layer assigns positions 1..N in that selected order
  ---------------------------------------------------------------------------
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

  ---------------------------------------------------------------------------
  -- 7) Mark lottery as drawn
  --
  -- Even if no eligible ticket exists, product rule says the lottery must still
  -- move to status = 'drawn' and the function must return an empty uuid[].
  ---------------------------------------------------------------------------
  UPDATE public.lotteries
  SET
    status = 'drawn',
    updated_at = now()
  WHERE id = p_lottery_id;

  ---------------------------------------------------------------------------
  -- 8) Return ordered list of winning ticket ids
  ---------------------------------------------------------------------------
  RETURN v_winner_ticket_ids;
END;
$$;

ALTER FUNCTION public.run_lottery(uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.run_lottery(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_lottery(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.run_lottery(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.run_lottery(uuid) TO service_role;

