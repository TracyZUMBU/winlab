-- Signup welcome bonus: idempotent credit via RPC (30 points, reference = profile).

CREATE UNIQUE INDEX IF NOT EXISTS wallet_signup_bonus_one_per_user
  ON public.wallet_transactions (user_id)
  WHERE transaction_type = 'signup_bonus'::public.wallet_transaction_type;

DROP FUNCTION IF EXISTS public.grant_signup_bonus();

CREATE FUNCTION public.grant_signup_bonus()
RETURNS TABLE (
  success boolean,
  already_granted boolean,
  amount integer,
  error_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_uid uuid;
  v_profile_exists boolean;
  v_signup_bonus_amount constant integer := 30;
begin
  v_uid := auth.uid();

  if v_uid is null then
    return query select false, false, 0, 'NOT_AUTHENTICATED'::text;
    return;
  end if;

  select exists (select 1 from public.profiles p where p.id = v_uid)
  into v_profile_exists;

  if not v_profile_exists then
    return query select false, false, 0, 'PROFILE_NOT_FOUND'::text;
    return;
  end if;

  if exists (
    select 1
    from public.wallet_transactions wt
    where wt.user_id = v_uid
      and wt.transaction_type = 'signup_bonus'::public.wallet_transaction_type
  ) then
    return query select true, true, v_signup_bonus_amount, null::text;
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
    v_uid,
    v_signup_bonus_amount,
    'credit',
    'signup_bonus',
    'profile',
    v_uid,
    'Welcome bonus'
  );

  return query select true, false, v_signup_bonus_amount, null::text;
  return;

exception
  when unique_violation then
    return query select true, true, v_signup_bonus_amount, null::text;
end;
$$;

ALTER FUNCTION public.grant_signup_bonus() OWNER TO postgres;

REVOKE ALL ON FUNCTION public.grant_signup_bonus() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_signup_bonus() TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_signup_bonus() TO service_role;

CREATE OR REPLACE FUNCTION public.get_wallet_transactions_enriched()
RETURNS TABLE (
  id uuid,
  amount integer,
  direction public.wallet_direction,
  transaction_type public.wallet_transaction_type,
  reference_type public.wallet_reference_type,
  reference_id uuid,
  created_at timestamptz,
  context_title text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    wt.id,
    wt.amount,
    wt.direction,
    wt.transaction_type,
    wt.reference_type,
    wt.reference_id,
    wt.created_at,
    COALESCE(
      m.title,
      lo.title,
      ref.referral_code,
      (
        SELECT m2.title
        FROM public.mission_completions mc2
        INNER JOIN public.missions m2 ON m2.id = mc2.mission_id
        WHERE mc2.reward_transaction_id = wt.id
        ORDER BY mc2.created_at DESC, mc2.id DESC
        LIMIT 1
      ),
      (
        SELECT l2.title
        FROM public.lottery_tickets ltx
        INNER JOIN public.lotteries l2 ON l2.id = ltx.lottery_id
        WHERE ltx.wallet_transaction_id = wt.id
        ORDER BY ltx.created_at DESC, ltx.id DESC
        LIMIT 1
      ),
      wt.description
    ) AS context_title
  FROM public.wallet_transactions wt
  LEFT JOIN public.mission_completions mc
    ON wt.reference_type = 'mission_completion'::public.wallet_reference_type
    AND wt.reference_id = mc.id
  LEFT JOIN public.missions m
    ON m.id = mc.mission_id
  LEFT JOIN public.lottery_tickets lt
    ON wt.reference_type = 'lottery_ticket'::public.wallet_reference_type
    AND wt.reference_id = lt.id
  LEFT JOIN public.lotteries lo
    ON lo.id = lt.lottery_id
  LEFT JOIN public.referrals ref
    ON wt.reference_type = 'referral'::public.wallet_reference_type
    AND wt.reference_id = ref.id
    AND ref.referrer_user_id = wt.user_id
  WHERE wt.user_id = auth.uid()
  ORDER BY wt.created_at DESC;
END;
$$;

ALTER FUNCTION public.get_wallet_transactions_enriched() OWNER TO postgres;

COMMENT ON FUNCTION public.get_wallet_transactions_enriched() IS
  'Wallet ledger + context_title: primary joins on reference_id; fallbacks via reward_transaction_id / wallet_transaction_id for legacy or inconsistent reference_id. signup_bonus uses wallet_transactions.description as context_title when joins do not apply.';

REVOKE ALL ON FUNCTION public.get_wallet_transactions_enriched() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_wallet_transactions_enriched() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_wallet_transactions_enriched() TO service_role;

COMMENT ON FUNCTION public.grant_signup_bonus() IS
  'Idempotent signup welcome bonus (30 credits). reference_type=profile, reference_id=profile id.';

CREATE OR REPLACE VIEW public.wallet_transactions_ui
WITH (security_invoker = true) AS
SELECT
  wt.id,
  wt.user_id,
  wt.amount,
  wt.direction,
  wt.transaction_type,
  wt.reference_type,
  wt.reference_id,
  wt.description,
  wt.created_at,
  COALESCE(m.title, lo.title, ref.referral_code, wt.description) AS context_title
FROM public.wallet_transactions wt
LEFT JOIN public.mission_completions mc
  ON wt.reference_type = 'mission_completion'::public.wallet_reference_type
  AND wt.reference_id = mc.id
  AND mc.user_id = wt.user_id
LEFT JOIN public.missions m
  ON m.id = mc.mission_id
LEFT JOIN public.lottery_tickets lt
  ON wt.reference_type = 'lottery_ticket'::public.wallet_reference_type
  AND wt.reference_id = lt.id
  AND lt.user_id = wt.user_id
LEFT JOIN public.lotteries lo
  ON lo.id = lt.lottery_id
LEFT JOIN public.referrals ref
  ON wt.reference_type = 'referral'::public.wallet_reference_type
  AND wt.reference_id = ref.id
  AND ref.referrer_user_id = wt.user_id;

COMMENT ON VIEW public.wallet_transactions_ui IS
  'Wallet ledger rows with context_title: mission title, lottery title, referral_code, or description (e.g. signup_bonus). May be NULL if reference is missing or RLS hides the joined row.';

GRANT SELECT ON public.wallet_transactions_ui TO anon;
GRANT SELECT ON public.wallet_transactions_ui TO authenticated;
GRANT SELECT ON public.wallet_transactions_ui TO service_role;
