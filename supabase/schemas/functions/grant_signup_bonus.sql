-- Signup welcome bonus: idempotent credit (30 points, reference = profile).

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

COMMENT ON FUNCTION public.grant_signup_bonus() IS
  'Idempotent signup welcome bonus (30 credits). reference_type=profile, reference_id=profile id.';
