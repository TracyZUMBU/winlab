-- Admin read RPCs for missions (SECURITY DEFINER + is_admin guard).
-- List: admin_get_missions (paginated rows) + admin_get_missions_count (same filters).
-- Detail: admin_get_mission_detail (no metadata / proof_data).

COMMENT ON FUNCTION public.is_admin(uuid) IS
  'Returns true when profiles.is_admin is true for the given user id (typically auth.uid()). Used by admin read RPCs (lotteries, missions) and RLS.';

CREATE OR REPLACE FUNCTION public.admin_get_missions(
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_title_search text DEFAULT NULL,
  p_brand_id uuid DEFAULT NULL,
  p_status public.mission_status DEFAULT NULL,
  p_mission_type public.mission_type DEFAULT NULL,
  p_sort text DEFAULT 'created_at_desc'
)
RETURNS TABLE (
  mission_id uuid,
  title text,
  brand_id uuid,
  brand_name text,
  mission_type public.mission_type,
  status public.mission_status,
  token_reward integer,
  validation_mode public.mission_validation_mode,
  starts_at timestamptz,
  ends_at timestamptz,
  total_completions bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit integer;
  v_offset integer;
  v_title text;
  v_order text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'WINLAB_ADMIN_REQUIRED'
      USING ERRCODE = '42501';
  END IF;

  v_limit := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
  v_offset := GREATEST(COALESCE(p_offset, 0), 0);
  v_title := NULLIF(trim(COALESCE(p_title_search, '')), '');

  v_order := CASE trim(coalesce(p_sort, ''))
    WHEN 'created_at_desc' THEN 'm.created_at DESC NULLS LAST, m.id ASC'
    WHEN 'created_at_asc' THEN 'm.created_at ASC NULLS LAST, m.id ASC'
    WHEN 'starts_at_desc' THEN 'm.starts_at DESC NULLS LAST, m.id ASC'
    WHEN 'starts_at_asc' THEN 'm.starts_at ASC NULLS LAST, m.id ASC'
    WHEN 'ends_at_desc' THEN 'm.ends_at DESC NULLS LAST, m.id ASC'
    WHEN 'ends_at_asc' THEN 'm.ends_at ASC NULLS LAST, m.id ASC'
    WHEN 'title_asc' THEN 'm.title ASC, m.id ASC'
    WHEN 'title_desc' THEN 'm.title DESC, m.id ASC'
    WHEN 'token_reward_desc' THEN 'm.token_reward DESC, m.id ASC'
    WHEN 'token_reward_asc' THEN 'm.token_reward ASC, m.id ASC'
    WHEN 'total_completions_desc' THEN 'COALESCE(cc.cnt, 0)::bigint DESC, m.id ASC'
    WHEN 'total_completions_asc' THEN 'COALESCE(cc.cnt, 0)::bigint ASC, m.id ASC'
    ELSE 'm.created_at DESC NULLS LAST, m.id ASC'
  END;

  RETURN QUERY EXECUTE format(
    $sql$
    SELECT
      m.id AS mission_id,
      m.title,
      m.brand_id,
      b.name AS brand_name,
      m.mission_type,
      m.status,
      m.token_reward,
      m.validation_mode,
      m.starts_at,
      m.ends_at,
      COALESCE(cc.cnt, 0)::bigint AS total_completions
    FROM public.missions m
    INNER JOIN public.brands b
      ON b.id = m.brand_id
    LEFT JOIN (
      SELECT
        mc.mission_id,
        COUNT(*)::bigint AS cnt
      FROM public.mission_completions mc
      GROUP BY mc.mission_id
    ) cc
      ON cc.mission_id = m.id
    WHERE ($1::text IS NULL OR m.title ILIKE ('%%' || $1 || '%%'))
      AND ($2::uuid IS NULL OR m.brand_id = $2)
      AND ($3::mission_status IS NULL OR m.status = $3)
      AND ($4::mission_type IS NULL OR m.mission_type = $4)
    ORDER BY %s
    LIMIT $5 OFFSET $6
    $sql$,
    v_order
  )
  USING v_title, p_brand_id, p_status, p_mission_type, v_limit, v_offset;
END;
$$;

ALTER FUNCTION public.admin_get_missions(
  integer,
  integer,
  text,
  uuid,
  public.mission_status,
  public.mission_type,
  text
) OWNER TO postgres;

COMMENT ON FUNCTION public.admin_get_missions(
  integer,
  integer,
  text,
  uuid,
  public.mission_status,
  public.mission_type,
  text
) IS
  'Backoffice: paginated mission list with completion counts. Filters must match admin_get_missions_count. Caller must be profiles.is_admin.';

CREATE OR REPLACE FUNCTION public.admin_get_missions_count(
  p_title_search text DEFAULT NULL,
  p_brand_id uuid DEFAULT NULL,
  p_status public.mission_status DEFAULT NULL,
  p_mission_type public.mission_type DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_title text;
  v_count bigint;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'WINLAB_ADMIN_REQUIRED'
      USING ERRCODE = '42501';
  END IF;

  v_title := NULLIF(trim(COALESCE(p_title_search, '')), '');

  SELECT COUNT(*)::bigint
  INTO v_count
  FROM public.missions m
  WHERE (v_title IS NULL OR m.title ILIKE ('%' || v_title || '%'))
    AND (p_brand_id IS NULL OR m.brand_id = p_brand_id)
    AND (p_status IS NULL OR m.status = p_status)
    AND (p_mission_type IS NULL OR m.mission_type = p_mission_type);

  RETURN COALESCE(v_count, 0);
END;
$$;

ALTER FUNCTION public.admin_get_missions_count(
  text,
  uuid,
  public.mission_status,
  public.mission_type
) OWNER TO postgres;

COMMENT ON FUNCTION public.admin_get_missions_count(
  text,
  uuid,
  public.mission_status,
  public.mission_type
) IS
  'Backoffice: total rows for admin_get_missions with the same filter params (no pagination). Caller must be profiles.is_admin.';

CREATE OR REPLACE FUNCTION public.admin_get_mission_detail(p_mission_id uuid)
RETURNS TABLE (
  mission_id uuid,
  title text,
  description text,
  brand_id uuid,
  brand_name text,
  mission_type public.mission_type,
  status public.mission_status,
  token_reward integer,
  validation_mode public.mission_validation_mode,
  starts_at timestamptz,
  ends_at timestamptz,
  max_completions_total integer,
  max_completions_per_user integer,
  image_url text,
  created_at timestamptz,
  updated_at timestamptz,
  total_completions bigint,
  pending_completions bigint,
  approved_completions bigint,
  rejected_completions bigint,
  completed_users jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'WINLAB_ADMIN_REQUIRED'
      USING ERRCODE = '42501';
  END IF;

  IF p_mission_id IS NULL THEN
    RAISE EXCEPTION 'WINLAB_INVALID_MISSION_ID'
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    m.id AS mission_id,
    m.title,
    m.description,
    m.brand_id,
    b.name AS brand_name,
    m.mission_type,
    m.status,
    m.token_reward,
    m.validation_mode,
    m.starts_at,
    m.ends_at,
    m.max_completions_total,
    m.max_completions_per_user,
    m.image_url,
    m.created_at,
    m.updated_at,
    COALESCE(st.total_completions, 0)::bigint,
    COALESCE(st.pending_completions, 0)::bigint,
    COALESCE(st.approved_completions, 0)::bigint,
    COALESCE(st.rejected_completions, 0)::bigint,
    COALESCE(cu.completed_users, '[]'::jsonb)
  FROM public.missions m
  INNER JOIN public.brands b
    ON b.id = m.brand_id
  LEFT JOIN (
    SELECT
      mc.mission_id,
      COUNT(*)::bigint AS total_completions,
      COUNT(*) FILTER (WHERE mc.status = 'pending')::bigint AS pending_completions,
      COUNT(*) FILTER (WHERE mc.status = 'approved')::bigint AS approved_completions,
      COUNT(*) FILTER (WHERE mc.status = 'rejected')::bigint AS rejected_completions
    FROM public.mission_completions mc
    WHERE mc.mission_id = p_mission_id
    GROUP BY mc.mission_id
  ) st
    ON st.mission_id = m.id
  LEFT JOIN LATERAL (
    SELECT
      jsonb_agg(
        jsonb_build_object(
          'user_id', u.user_id,
          'username', u.username
        )
        ORDER BY u.username ASC
      ) AS completed_users
    FROM (
      SELECT DISTINCT
        mc.user_id,
        p.username
      FROM public.mission_completions mc
      INNER JOIN public.profiles p
        ON p.id = mc.user_id
      WHERE mc.mission_id = p_mission_id
    ) u
  ) cu
    ON TRUE
  WHERE m.id = p_mission_id;
END;
$$;

ALTER FUNCTION public.admin_get_mission_detail(uuid) OWNER TO postgres;

COMMENT ON FUNCTION public.admin_get_mission_detail(uuid) IS
  'Backoffice: one mission row with completion aggregates and distinct completers (user_id + username). No metadata or proof_data. Caller must be profiles.is_admin; empty set if id unknown.';

REVOKE ALL ON FUNCTION public.admin_get_missions(
  integer,
  integer,
  text,
  uuid,
  public.mission_status,
  public.mission_type,
  text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_missions(
  integer,
  integer,
  text,
  uuid,
  public.mission_status,
  public.mission_type,
  text
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_missions(
  integer,
  integer,
  text,
  uuid,
  public.mission_status,
  public.mission_type,
  text
) TO service_role;

REVOKE ALL ON FUNCTION public.admin_get_missions_count(
  text,
  uuid,
  public.mission_status,
  public.mission_type
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_missions_count(
  text,
  uuid,
  public.mission_status,
  public.mission_type
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_missions_count(
  text,
  uuid,
  public.mission_status,
  public.mission_type
) TO service_role;

REVOKE ALL ON FUNCTION public.admin_get_mission_detail(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_mission_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_mission_detail(uuid) TO service_role;
