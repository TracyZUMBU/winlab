-- Allow users to read mission rows they participated in (ended / non-available missions),
-- so "completed missions" lists can join mission -> brand. ORs with the existing
-- "available missions" policy.
DROP POLICY IF EXISTS "Users can view missions they have a completion for" ON public.missions;

CREATE POLICY "Users can view missions they have a completion for"
ON public.missions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.mission_completions mc
    WHERE mc.mission_id = missions.id
      AND mc.user_id = auth.uid()
  )
);

-- Canonical copy: supabase/schemas/functions/get_todo_missions_page.sql
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
    AND NOT EXISTS (
      SELECT 1
      FROM public.mission_completions mca
      WHERE mca.mission_id = m.id
        AND mca.user_id = auth.uid()
        AND mca.status = 'approved'::public.mission_completion_status
    )
  ORDER BY m.ends_at ASC NULLS LAST, m.id ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

ALTER FUNCTION public.get_todo_missions_page(integer, integer) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.get_todo_missions_page(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_todo_missions_page(integer, integer) TO authenticated;
