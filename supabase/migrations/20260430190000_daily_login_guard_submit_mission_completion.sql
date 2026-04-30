DROP FUNCTION IF EXISTS public.submit_mission_completion(uuid, jsonb);

CREATE FUNCTION public.submit_mission_completion(
  p_mission_id uuid,
  p_proof_data jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  success boolean,
  completion_id uuid,
  error_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_user_id uuid;
  v_mission public.missions%rowtype;
  v_completion_id uuid;
  v_existing_count integer;
  v_daily_existing_count integer;
  v_total_count integer;
begin
  v_user_id := auth.uid();

  -- check if user is authenticated
  if v_user_id is null then
    return query select false, null::uuid, 'UNAUTHENTICATED'::text;
    return;
  end if;

  -- check if mission exists
  select *
  into v_mission
  from public.missions
  where id = p_mission_id;

  if not found then
    return query select false, null::uuid, 'MISSION_NOT_FOUND'::text;
    return;
  end if;

  -- check if mission is active
  if v_mission.status <> 'active' then
    return query select false, null::uuid, 'MISSION_NOT_ACTIVE'::text;
    return;
  end if;

  -- check if mission is started
  if v_mission.starts_at is not null and v_mission.starts_at > now() then
    return query select false, null::uuid, 'MISSION_NOT_STARTED'::text;
    return;
  end if;

  -- check if mission is expired
  if v_mission.ends_at is not null and v_mission.ends_at < now() then
    return query select false, null::uuid, 'MISSION_EXPIRED'::text;
    return;
  end if;

  -- daily_login missions: at most one pending/approved completion per UTC day.
  if v_mission.mission_type = 'daily_login' then
    -- serialize per (user, mission, UTC day) to avoid double-credit under concurrency.
    perform pg_advisory_xact_lock(
      hashtextextended(
        concat_ws(
          ':',
          v_user_id::text,
          p_mission_id::text,
          (now() at time zone 'UTC')::date::text
        ),
        0
      )
    );

    select count(*)
    into v_daily_existing_count
    from public.mission_completions
    where mission_id = p_mission_id
      and user_id = v_user_id
      and status in ('pending', 'approved')
      and (completed_at at time zone 'UTC')::date = (now() at time zone 'UTC')::date;

    if v_daily_existing_count > 0 then
      return query select false, null::uuid, 'MISSION_USER_LIMIT_REACHED'::text;
      return;
    end if;
  end if;

  -- check if mission completion limit reached for this user
  select count(*)
  into v_existing_count
  from public.mission_completions
  where mission_id = p_mission_id
    and user_id = v_user_id
    and status in ('pending', 'approved');

  -- check if mission completion limit reached for all users
  if v_mission.max_completions_per_user is not null
     and v_existing_count >= v_mission.max_completions_per_user then
    return query select false, null::uuid, 'MISSION_USER_LIMIT_REACHED'::text;
    return;
  end if;

  -- check if mission completion limit reached for all users
  if v_mission.max_completions_total is not null then
    select count(*)
    into v_total_count
    from public.mission_completions
    where mission_id = p_mission_id
      and status in ('pending', 'approved');

    if v_total_count >= v_mission.max_completions_total then
      return query select false, null::uuid, 'MISSION_TOTAL_LIMIT_REACHED'::text;
      return;
    end if;
  end if;

  -- create mission completion
  insert into public.mission_completions (
    mission_id,
    user_id,
    status,
    completed_at,
    proof_data
  )
  values (
    p_mission_id,
    v_user_id,
    'pending',
    now(),
    coalesce(p_proof_data, '{}'::jsonb)
  )
  returning id into v_completion_id;

  -- approve mission completion if validation mode is automatic
  if v_mission.validation_mode = 'automatic' then
    perform public.approve_mission_completion(v_completion_id);
  end if;

  return query select true, v_completion_id, null::text;
end;
$$;

ALTER FUNCTION public.submit_mission_completion(uuid, jsonb) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.submit_mission_completion(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_mission_completion(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_mission_completion(uuid, jsonb) TO service_role;
