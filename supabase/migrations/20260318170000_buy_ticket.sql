CREATE OR REPLACE FUNCTION public.buy_ticket(
  p_lottery_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_user_id uuid;
  v_lottery public.lotteries%rowtype;
  v_wallet_balance bigint;
  v_wallet_transaction_id uuid;
  v_ticket_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'UNAUTHENTICATED: you must be logged in to buy a ticket';
  end if;
-- Serialize purchases per user to prevent overspending with concurrent calls.
-- (We don't have a dedicated "wallet" row to lock, so we lock using an advisory lock.)
  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  -- Lock the lottery row so the "active/starts/ends" checks remain consistent for this txn.
  select *
  into v_lottery
  from public.lotteries
  where id = p_lottery_id
  for update;

  if not found then
    raise exception 'LOTTERY_NOT_FOUND: lottery does not exist';
  end if;

  -- Check that the lottery is purchasable.
  if v_lottery.status <> 'active' then
    raise exception 'LOTTERY_NOT_PURCHASABLE: status=%', v_lottery.status;
  end if;

  -- Check that the lottery has not started yet.
  if v_lottery.starts_at is not null and v_lottery.starts_at > now() then
    raise exception 'LOTTERY_NOT_STARTED: starts_at=%', v_lottery.starts_at;
  end if;

  -- Check that the lottery has not expired yet.
  if v_lottery.ends_at is not null and v_lottery.ends_at <= now() then
    raise exception 'LOTTERY_EXPIRED: ends_at=%', v_lottery.ends_at;
  end if;

  -- Check that the lottery has not drawn yet.
  if v_lottery.draw_at <= now() then
    raise exception 'LOTTERY_DRAW_ALREADY_STARTED: draw_at=%', v_lottery.draw_at;
  end if;

  -- Check wallet balance (computed from wallet_transactions).
  select ub.balance
  into v_wallet_balance
  from public.user_wallet_balance ub
  where ub.user_id = v_user_id;

  if v_wallet_balance is null then
    v_wallet_balance := 0;
  end if;

  if v_wallet_balance < v_lottery.ticket_cost then
    raise exception 'INSUFFICIENT_TOKENS: balance=% ticket_cost=%', v_wallet_balance, v_lottery.ticket_cost;
  end if;
-- 1) Create the wallet debit first, with reference_id = NULL (circular dependency).
  insert into public.wallet_transactions (
    user_id,
    amount,
    direction,
    transaction_type,
    reference_type,
    reference_id,
    description
  )
  values (
    v_user_id,
    v_lottery.ticket_cost,
    'debit',
    'ticket_purchase',
    'lottery_ticket',
    null,
    'Lottery ticket purchase'
  )
  returning id into v_wallet_transaction_id;

  -- 2) Create the ticket, linking it to the debit transaction.
  insert into public.lottery_tickets (
    lottery_id,
    user_id,
    wallet_transaction_id
  )
  values (
    v_lottery.id,
    v_user_id,
    v_wallet_transaction_id
  )
  returning id into v_ticket_id;

  -- 3) Complete the circular linkage: transaction.reference_id -> ticket.id
  update public.wallet_transactions
  set reference_id = v_ticket_id
  where id = v_wallet_transaction_id;

  return v_ticket_id;
end;
$$;

ALTER FUNCTION public.buy_ticket(uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.buy_ticket(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buy_ticket(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buy_ticket(uuid) TO service_role;