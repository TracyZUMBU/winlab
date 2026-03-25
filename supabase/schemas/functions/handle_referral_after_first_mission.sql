DROP FUNCTION IF EXISTS public.handle_referral_after_first_mission(uuid);

CREATE FUNCTION public.handle_referral_after_first_mission(
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_referral public.referrals%rowtype;
  v_approved_count integer;
  v_transaction_id uuid;
begin
  -- Ensure the user has exactly one approved mission with an issued reward.
  select count(*)
  into v_approved_count
  from public.mission_completions
  where user_id = p_user_id
    and status = 'approved'
    and reward_transaction_id is not null;

  if v_approved_count <> 1 then
    return;
  end if;

  -- Lock the referral row to avoid double-qualifying/rewarding.
  select *
  into v_referral
  from public.referrals
  where referred_user_id = p_user_id
    and status = 'pending'
  for update;

  if not found then
    return;
  end if;

  update public.referrals
  set
    status = 'qualified',
    qualified_at = now(),
    updated_at = now()
  where id = v_referral.id;

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
    v_referral.referrer_user_id,
    30,
    'credit',
    'referral_bonus',
    'referral',
    v_referral.id,
    'Referral bonus'
  )
  returning id into v_transaction_id;

  update public.referrals
  set
    status = 'rewarded',
    reward_transaction_id = v_transaction_id,
    updated_at = now()
  where id = v_referral.id;
end;
$$;

ALTER FUNCTION public.handle_referral_after_first_mission(uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.handle_referral_after_first_mission(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_referral_after_first_mission(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_referral_after_first_mission(uuid) TO service_role;

