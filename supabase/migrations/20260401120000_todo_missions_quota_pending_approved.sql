-- Todo mission lists: exclude when pending+approved count reaches per-user cap (same as submit_mission_completion).
-- Canonical: supabase/schemas/functions/get_user_home_dashboard.sql, get_todo_missions_page.sql

CREATE OR REPLACE FUNCTION public.get_user_home_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_profile jsonb;
  v_balance bigint;
  v_ongoing jsonb;
  v_participations jsonb;
  v_missions jsonb;
BEGIN
  v_uid := auth.uid();

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: you must be logged in';
  END IF;

  SELECT jsonb_build_object(
    'username', p.username,
    'avatar_url', p.avatar_url
  )
  INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_uid;

  SELECT COALESCE(
    (
      SELECT uwb.balance::bigint
      FROM public.user_wallet_balance uwb
      WHERE uwb.user_id = v_uid
    ),
    0::bigint
  )
  INTO v_balance;

  WITH ordered_eligible AS (
    SELECT
      l.id,
      l.title,
      l.image_url,
      l.ticket_cost,
      l.ends_at,
      l.is_featured
    FROM public.lotteries l
    INNER JOIN public.brands b ON b.id = l.brand_id AND b.is_active = true
    WHERE l.status = 'active'
      AND (l.starts_at IS NULL OR l.starts_at <= now())
      AND (l.ends_at IS NULL OR l.ends_at >= now())
    ORDER BY l.is_featured DESC, l.ends_at ASC NULLS LAST, l.id ASC
    LIMIT 8
  ),
  with_counts AS (
    SELECT
      e.id,
      e.title,
      e.image_url,
      e.ticket_cost,
      e.ends_at,
      e.is_featured,
      (
        SELECT COUNT(*)::bigint
        FROM public.lottery_tickets lt
        WHERE lt.lottery_id = e.id
          AND lt.status = 'active'
      ) AS active_tickets_count,
      (
        SELECT COUNT(*)::bigint
        FROM public.lottery_tickets lt
        WHERE lt.lottery_id = e.id
          AND lt.status = 'active'
          AND lt.user_id = v_uid
      ) AS user_active_tickets_count
    FROM ordered_eligible e
  )
  SELECT COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', wc.id,
          'title', wc.title,
          'image_url', wc.image_url,
          'ticket_cost', wc.ticket_cost,
          'ends_at', wc.ends_at,
          'is_ending_soon',
            wc.ends_at IS NOT NULL
            AND wc.ends_at > now()
            AND wc.ends_at < now() + interval '24 hours',
          'active_tickets_count', wc.active_tickets_count,
          'user_active_tickets_count', wc.user_active_tickets_count
        )
        ORDER BY wc.is_featured DESC, wc.ends_at ASC NULLS LAST, wc.id ASC
      )
      FROM with_counts wc
    ),
    '[]'::jsonb
  )
  INTO v_ongoing;

  WITH particip AS (
    SELECT
      l.id,
      l.title,
      l.image_url,
      l.draw_at,
      (
        SELECT COUNT(*)::bigint
        FROM public.lottery_tickets lt
        WHERE lt.lottery_id = l.id
          AND lt.user_id = v_uid
          AND lt.status = 'active'
      ) AS user_ticket_count,
      (
        SELECT COUNT(*)::bigint
        FROM public.lottery_tickets lt
        WHERE lt.lottery_id = l.id
          AND lt.status = 'active'
      ) AS total_active_tickets
    FROM public.lotteries l
    INNER JOIN public.brands b ON b.id = l.brand_id AND b.is_active = true
    WHERE l.status = 'active'
      AND (l.ends_at IS NULL OR l.ends_at >= now())
      AND EXISTS (
        SELECT 1
        FROM public.lottery_tickets lt
        WHERE lt.lottery_id = l.id
          AND lt.user_id = v_uid
          AND lt.status = 'active'
      )
    ORDER BY l.draw_at ASC NULLS LAST, l.id ASC
    LIMIT 5
  )
  SELECT COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'lottery_id', p.id,
          'title', p.title,
          'image_url', p.image_url,
          'draw_at', p.draw_at,
          'user_ticket_count', p.user_ticket_count,
          'total_active_tickets', p.total_active_tickets,
          'win_probability',
            CASE
              WHEN p.total_active_tickets > 0 THEN
                ROUND(
                  (p.user_ticket_count::numeric / p.total_active_tickets::numeric)::numeric,
                  6
                )
              ELSE NULL
            END
        )
        ORDER BY p.draw_at ASC NULLS LAST, p.id ASC
      )
      FROM particip p
    ),
    '[]'::jsonb
  )
  INTO v_participations;

  WITH mission_rows AS (
    SELECT
      m.id,
      m.title,
      m.mission_type,
      m.token_reward,
      m.image_url,
      m.max_completions_per_user,
      m.ends_at,
      (
        SELECT COUNT(*)::int
        FROM public.mission_completions mc
        WHERE mc.mission_id = m.id
          AND mc.user_id = v_uid
          AND mc.status IN ('pending', 'approved')
      ) AS user_completions_used
    FROM public.missions m
    INNER JOIN public.brands b ON b.id = m.brand_id AND b.is_active = true
    WHERE m.status = 'active'::public.mission_status
      AND (m.starts_at IS NULL OR m.starts_at <= now())
      AND (m.ends_at IS NULL OR m.ends_at >= now())
      -- Repeatable missions / quota: same rule as submit_mission_completion (pending + approved).
      -- exclude when the user cannot submit another completion for this mission.
      AND (
        SELECT COUNT(*)::int
        FROM public.mission_completions mca
        WHERE mca.mission_id = m.id
          AND mca.user_id = v_uid
          AND mca.status IN ('pending', 'approved')
      ) < COALESCE(m.max_completions_per_user, 1)
    ORDER BY m.ends_at ASC NULLS LAST, m.id ASC
    LIMIT 5
  )
  SELECT COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', mr.id,
          'title', mr.title,
          'mission_type', mr.mission_type,
          'token_reward', mr.token_reward,
          'image_url', mr.image_url,
          'max_completions_per_user', mr.max_completions_per_user,
          'user_completions_used', mr.user_completions_used
        )
        ORDER BY mr.ends_at ASC NULLS LAST, mr.id ASC
      )
      FROM mission_rows mr
    ),
    '[]'::jsonb
  )
  INTO v_missions;

  RETURN jsonb_build_object(
    'profile', COALESCE(v_profile, '{}'::jsonb),
    'wallet_balance', v_balance,
    'ongoing_lotteries', COALESCE(v_ongoing, '[]'::jsonb),
    'participations', COALESCE(v_participations, '[]'::jsonb),
    'mission_previews', COALESCE(v_missions, '[]'::jsonb)
  );
END;
$$;

ALTER FUNCTION public.get_user_home_dashboard() OWNER TO postgres;

COMMENT ON FUNCTION public.get_user_home_dashboard() IS
  'Snapshot JSON for the mobile home dashboard: profile, balance, ongoing lotteries, participations, mission teasers.';

REVOKE ALL ON FUNCTION public.get_user_home_dashboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_home_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_home_dashboard() TO service_role;

CREATE OR REPLACE FUNCTION public.get_todo_missions_page(
  p_limit integer,
  p_offset integer
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  mission_type public.mission_type,
  token_reward integer,
  ends_at timestamp with time zone,
  image_url text,
  brand jsonb,
  mission_completions jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Unlike get_user_home_dashboard(), we do not RAISE when auth.uid() IS NULL: this RPC
  -- returns a paginated row set; yielding zero rows keeps list UIs and pagination simple
  -- (empty state) instead of an exception for missing or not-yet-established sessions.
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION 'p_limit must be between 1 and 100';
  END IF;

  IF p_offset IS NULL OR p_offset < 0 THEN
    RAISE EXCEPTION 'p_offset must be >= 0';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.title,
    m.description,
    m.mission_type,
    m.token_reward,
    m.ends_at,
    m.image_url,
    jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'logo_url', b.logo_url
    ) AS brand,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', mc.id,
            'status', mc.status,
            'user_id', mc.user_id
          )
        )
        FROM public.mission_completions mc
        WHERE mc.mission_id = m.id
          AND mc.user_id = auth.uid()
      ),
      '[]'::jsonb
    ) AS mission_completions
  FROM public.missions m
  INNER JOIN public.brands b ON b.id = m.brand_id AND b.is_active = true
  WHERE m.status = 'active'::public.mission_status
    AND (m.starts_at IS NULL OR m.starts_at <= now())
    AND (m.ends_at IS NULL OR m.ends_at >= now())
    -- Repeatable missions / quota: pending + approved (same as submit_mission_completion).
    AND (
      SELECT COUNT(*)::int
      FROM public.mission_completions mca
      WHERE mca.mission_id = m.id
        AND mca.user_id = auth.uid()
        AND mca.status IN ('pending', 'approved')
    ) < COALESCE(m.max_completions_per_user, 1)
  ORDER BY m.ends_at ASC NULLS LAST, m.id ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

ALTER FUNCTION public.get_todo_missions_page(integer, integer) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.get_todo_missions_page(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_todo_missions_page(integer, integer) TO authenticated;
