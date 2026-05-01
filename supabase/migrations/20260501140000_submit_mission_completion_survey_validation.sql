-- Survey missions: validate metadata.survey + ordered proof answers before insert.

CREATE OR REPLACE FUNCTION public.submit_mission_completion(
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

  if v_user_id is null then
    return query select false, null::uuid, 'UNAUTHENTICATED'::text;
    return;
  end if;

  select *
  into v_mission
  from public.missions
  where id = p_mission_id;

  if not found then
    return query select false, null::uuid, 'MISSION_NOT_FOUND'::text;
    return;
  end if;

  if v_mission.status <> 'active' then
    return query select false, null::uuid, 'MISSION_NOT_ACTIVE'::text;
    return;
  end if;

  if v_mission.starts_at is not null and v_mission.starts_at > now() then
    return query select false, null::uuid, 'MISSION_NOT_STARTED'::text;
    return;
  end if;

  if v_mission.ends_at is not null and v_mission.ends_at < now() then
    return query select false, null::uuid, 'MISSION_EXPIRED'::text;
    return;
  end if;

  if v_mission.mission_type = 'daily_login' then
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

  if v_mission.max_completions_per_user is not null then
    perform pg_advisory_xact_lock(
      hashtextextended(
        concat_ws(
          ':',
          'submit_mission_completion',
          'per_user',
          p_mission_id::text,
          v_user_id::text
        ),
        1
      )
    );
  end if;

  if v_mission.max_completions_total is not null then
    perform pg_advisory_xact_lock(
      hashtextextended(
        concat_ws(
          ':',
          'submit_mission_completion',
          'total',
          p_mission_id::text
        ),
        2
      )
    );
  end if;

  select count(*)
  into v_existing_count
  from public.mission_completions
  where mission_id = p_mission_id
    and user_id = v_user_id
    and status in ('pending', 'approved');

  if v_mission.max_completions_per_user is not null
     and v_existing_count >= v_mission.max_completions_per_user then
    return query select false, null::uuid, 'MISSION_USER_LIMIT_REACHED'::text;
    return;
  end if;

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

  if v_mission.mission_type = 'survey' then
    <<survey_block>>
    declare
      v_survey jsonb;
      v_start text;
      v_questions jsonb;
      v_answers jsonb;
      v_arr_len integer;
      v_idx integer := 0;
      v_current text;
      v_step jsonb;
      v_q jsonb;
      v_qtype text;
      v_single_answer text;
      v_multi jsonb;
      v_next text;
      v_found_opt boolean;
      v_mc_total bigint;
      v_mc_distinct bigint;
      v_mc_i integer;
      v_mc_pick text;
      v_opt_exists boolean;
      v_opt_rec record;
    begin
      v_survey := coalesce(v_mission.metadata, '{}'::jsonb) -> 'survey';

      if v_survey is null or jsonb_typeof(v_survey) <> 'object' then
        return query select false, null::uuid, 'SURVEY_CONFIG_INVALID'::text;
        return;
      end if;

      if not (v_survey ? 'startQuestionId')
         or not (v_survey ? 'questions')
         or jsonb_typeof(v_survey -> 'questions') <> 'array'
         or jsonb_array_length(v_survey -> 'questions') = 0 then
        return query select false, null::uuid, 'SURVEY_CONFIG_INVALID'::text;
        return;
      end if;

      v_start := nullif(trim(v_survey ->> 'startQuestionId'), '');
      if v_start is null then
        return query select false, null::uuid, 'SURVEY_CONFIG_INVALID'::text;
        return;
      end if;

      v_questions := v_survey -> 'questions';

      if p_proof_data is null or jsonb_typeof(p_proof_data) <> 'object' then
        return query select false, null::uuid, 'SURVEY_PROOF_INVALID'::text;
        return;
      end if;

      if (p_proof_data ? 'surveyId')
         and jsonb_typeof(p_proof_data -> 'surveyId') <> 'string' then
        return query select false, null::uuid, 'SURVEY_PROOF_INVALID'::text;
        return;
      end if;

      if not (p_proof_data ? 'answers')
         or jsonb_typeof(p_proof_data -> 'answers') <> 'array' then
        return query select false, null::uuid, 'SURVEY_PROOF_INVALID'::text;
        return;
      end if;

      v_answers := p_proof_data -> 'answers';
      v_arr_len := jsonb_array_length(v_answers);

      if v_arr_len is null or v_arr_len = 0 then
        return query select false, null::uuid, 'SURVEY_ANSWERS_INVALID'::text;
        return;
      end if;

      v_current := v_start;

      while v_current is not null loop
        if v_idx >= v_arr_len then
          return query select false, null::uuid, 'SURVEY_ANSWERS_INVALID'::text;
          return;
        end if;

        v_step := v_answers -> v_idx;

        if jsonb_typeof(v_step) <> 'object'
           or not (v_step ? 'questionId')
           or not (v_step ? 'value') then
          return query select false, null::uuid, 'SURVEY_PROOF_INVALID'::text;
          return;
        end if;

        if v_step ->> 'questionId' is distinct from v_current then
          return query select false, null::uuid, 'SURVEY_ANSWERS_INVALID'::text;
          return;
        end if;

        select e.value
        into v_q
        from jsonb_array_elements(v_questions) as e
        where e.value ->> 'id' is not distinct from v_current
        limit 1;

        if not found then
          return query select false, null::uuid, 'SURVEY_CONFIG_INVALID'::text;
          return;
        end if;

        v_qtype := v_q ->> 'type';

        if v_qtype = 'text' then
          if length(trim(coalesce(v_step ->> 'value', ''))) = 0 then
            return query select false, null::uuid, 'SURVEY_ANSWERS_INVALID'::text;
            return;
          end if;
          v_next := nullif(trim(v_q ->> 'nextQuestionId'), '');

        elsif v_qtype = 'single_choice' then
          v_single_answer := v_step ->> 'value';
          if v_single_answer is null or length(trim(v_single_answer)) = 0 then
            return query select false, null::uuid, 'SURVEY_ANSWERS_INVALID'::text;
            return;
          end if;

          v_found_opt := false;
          v_next := null;

          for v_opt_rec in
            select *
            from jsonb_array_elements(coalesce(v_q -> 'options', '[]'::jsonb))
          loop
            if v_opt_rec.value ->> 'id' is not distinct from v_single_answer then
              v_found_opt := true;
              if (v_opt_rec.value ? 'nextQuestionId')
                 and nullif(trim(v_opt_rec.value ->> 'nextQuestionId'), '') is not null then
                v_next := trim(v_opt_rec.value ->> 'nextQuestionId');
              end if;
              exit;
            end if;
          end loop;

          if not v_found_opt then
            return query select false, null::uuid, 'SURVEY_ANSWERS_INVALID'::text;
            return;
          end if;

          if v_next is null then
            v_next := nullif(trim(v_q ->> 'nextQuestionId'), '');
          end if;

        elsif v_qtype = 'multi_choice' then
          v_multi := v_step -> 'value';
          if jsonb_typeof(v_multi) <> 'array' or jsonb_array_length(v_multi) = 0 then
            return query select false, null::uuid, 'SURVEY_ANSWERS_INVALID'::text;
            return;
          end if;

          select count(*)::bigint
          into v_mc_total
          from jsonb_array_elements_text(v_multi);

          select count(distinct jsonb_array_elements_text)::bigint
          into v_mc_distinct
          from jsonb_array_elements_text(v_multi);

          if v_mc_total <> v_mc_distinct then
            return query select false, null::uuid, 'SURVEY_ANSWERS_INVALID'::text;
            return;
          end if;

          for v_mc_i in 0 .. jsonb_array_length(v_multi) - 1 loop
            v_mc_pick := v_multi ->> v_mc_i;

            select exists (
              select 1
              from jsonb_array_elements(coalesce(v_q -> 'options', '[]'::jsonb)) o
              where o.value ->> 'id' is not distinct from v_mc_pick
            )
            into v_opt_exists;

            if not coalesce(v_opt_exists, false) then
              return query select false, null::uuid, 'SURVEY_ANSWERS_INVALID'::text;
              return;
            end if;
          end loop;

          v_next := nullif(trim(v_q ->> 'nextQuestionId'), '');

        else
          return query select false, null::uuid, 'SURVEY_CONFIG_INVALID'::text;
          return;
        end if;

        v_idx := v_idx + 1;
        v_current := v_next;
      end loop;

      if v_idx <> v_arr_len then
        return query select false, null::uuid, 'SURVEY_ANSWERS_INVALID'::text;
        return;
      end if;
    end survey_block;
  end if;

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
