-- RPC: optional referral registration using referrer profile referral_code (see schemas/functions/register_referral_with_code.sql).

DROP FUNCTION IF EXISTS public.register_referral_with_code(text);

CREATE FUNCTION public.register_referral_with_code(p_code text)
RETURNS TABLE (
  success boolean,
  error_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_uid uuid;
  v_normalized text;
  v_referrer_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return query select false, 'NOT_AUTHENTICATED'::text;
    return;
  end if;

  v_normalized := upper(trim(coalesce(p_code, '')));
  if v_normalized = '' then
    return query select true, null::text;
    return;
  end if;

  if length(v_normalized) <> 8 then
    return query select false, 'REFERRAL_CODE_INVALID_FORMAT'::text;
    return;
  end if;

  select p.id
  into v_referrer_id
  from public.profiles p
  where p.referral_code = v_normalized;

  if not found then
    return query select false, 'REFERRAL_CODE_NOT_FOUND'::text;
    return;
  end if;

  if v_referrer_id = v_uid then
    return query select false, 'REFERRAL_SELF_NOT_ALLOWED'::text;
    return;
  end if;

  if exists (
    select 1
    from public.referrals r
    where r.referred_user_id = v_uid
  ) then
    return query select false, 'REFERRAL_ALREADY_REGISTERED'::text;
    return;
  end if;

  insert into public.referrals (
    referrer_user_id,
    referred_user_id,
    referral_code,
    status
  )
  values (
    v_referrer_id,
    v_uid,
    v_normalized,
    'pending'
  );

  return query select true, null::text;
  return;

exception
  when unique_violation then
    return query select false, 'REFERRAL_ALREADY_REGISTERED'::text;
end;
$$;

ALTER FUNCTION public.register_referral_with_code(text) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.register_referral_with_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_referral_with_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_referral_with_code(text) TO service_role;
