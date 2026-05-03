-- Aligne buy_ticket avec lotteries.ends_at NOT NULL (voir schemas/functions/buy_ticket.sql).

CREATE OR REPLACE FUNCTION public.buy_ticket(
  p_lottery_id uuid
)
RETURNS TABLE (
  success boolean,
  ticket_id uuid,
  error_code text
)
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
    return query select false, null::uuid, 'UNAUTHENTICATED'::text;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  select *
  into v_lottery
  from public.lotteries
  where id = p_lottery_id
  for update;

  if not found then
    return query select false, null::uuid, 'LOTTERY_NOT_FOUND'::text;
    return;
  end if;

  if v_lottery.status <> 'active' then
    return query select false, null::uuid, 'LOTTERY_NOT_PURCHASABLE'::text;
    return;
  end if;

  if v_lottery.starts_at is not null and v_lottery.starts_at > now() then
    return query select false, null::uuid, 'LOTTERY_NOT_STARTED'::text;
    return;
  end if;

  if v_lottery.ends_at <= now() then
    return query select false, null::uuid, 'LOTTERY_EXPIRED'::text;
    return;
  end if;

  if v_lottery.draw_at <= now() then
    return query select false, null::uuid, 'LOTTERY_DRAW_ALREADY_STARTED'::text;
    return;
  end if;

  select ub.balance
  into v_wallet_balance
  from public.user_wallet_balance ub
  where ub.user_id = v_user_id;

  if v_wallet_balance is null then
    v_wallet_balance := 0;
  end if;

  if v_wallet_balance < v_lottery.ticket_cost then
    return query select false, null::uuid, 'INSUFFICIENT_TOKENS'::text;
    return;
  end if;

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

  update public.wallet_transactions
  set reference_id = v_ticket_id
  where id = v_wallet_transaction_id;

  return query select true, v_ticket_id, null::text;
end;
$$;

ALTER FUNCTION public.buy_ticket(uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.buy_ticket(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buy_ticket(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buy_ticket(uuid) TO service_role;
