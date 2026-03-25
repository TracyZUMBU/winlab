
DROP FUNCTION IF EXISTS public.approve_mission_completion(uuid);

CREATE FUNCTION public.approve_mission_completion(
  p_completion_id uuid
)
RETURNS TABLE (
  success boolean,
  error_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_completion public.mission_completions%rowtype;
  v_mission public.missions%rowtype;
  v_transaction_id uuid;
begin
  -- lock mission completion row
  select *
  into v_completion
  from public.mission_completions
  where id = p_completion_id
  for update;

  if not found then
    return query select false, 'MISSION_COMPLETION_NOT_FOUND'::text;
    return;
  end if;

  if v_completion.status = 'rejected' then
    return query select false, 'MISSION_COMPLETION_REJECTED'::text;
    return;
  end if;

  if v_completion.reward_transaction_id is not null then
    return query select false, 'MISSION_COMPLETION_ALREADY_REWARDED'::text;
    return;
  end if;

  -- load mission
  select *
  into v_mission
  from public.missions
  where id = v_completion.mission_id;

  if not found then
    return query select false, 'MISSION_NOT_FOUND'::text;
    return;
  end if;

  -- approve mission completion
  update public.mission_completions
  set
    status = 'approved',
    reviewed_at = now(),
    updated_at = now()
  where id = p_completion_id;

  -- create wallet transaction
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
    v_completion.user_id,
    v_mission.token_reward,
    'credit',
    'mission_reward',
    'mission_completion',
    v_completion.id,
    'Mission reward'
  )
  returning id into v_transaction_id;

  -- link reward transaction to completion
  update public.mission_completions
  set
    reward_transaction_id = v_transaction_id,
    updated_at = now()
  where id = p_completion_id;

  -- handle referral logic after first mission
  perform public.handle_referral_after_first_mission(v_completion.user_id);

  return query select true, null::text;
end;
$$;

ALTER FUNCTION public.approve_mission_completion(uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.approve_mission_completion(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_mission_completion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_mission_completion(uuid) TO service_role;
