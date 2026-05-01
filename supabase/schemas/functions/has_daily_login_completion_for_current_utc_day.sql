-- Mirrors submit_mission_completion daily_login guard: pending/approved completion
-- whose completed_at falls on the current UTC calendar day.
--
-- SECURITY DEFINER (aligned with submit_mission_completion): INVOKER + JOIN missions would
-- hide rows when missions RLS hides non-"available" missions, causing hasCompletion=false
-- while submit still counts completions (MISSION_USER_LIMIT_REACHED).

DROP FUNCTION IF EXISTS public.has_daily_login_completion_for_current_utc_day(uuid);

CREATE FUNCTION public.has_daily_login_completion_for_current_utc_day(p_mission_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.mission_completions mc
    INNER JOIN public.missions m
      ON m.id = mc.mission_id
      AND m.mission_type = 'daily_login'::public.mission_type
    WHERE mc.user_id = auth.uid()
      AND mc.mission_id = p_mission_id
      AND mc.status IN ('pending', 'approved')
      AND (mc.completed_at AT TIME ZONE 'UTC')::date = (now() AT TIME ZONE 'UTC')::date
  );
$$;

ALTER FUNCTION public.has_daily_login_completion_for_current_utc_day(uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.has_daily_login_completion_for_current_utc_day(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_daily_login_completion_for_current_utc_day(uuid) TO authenticated;
