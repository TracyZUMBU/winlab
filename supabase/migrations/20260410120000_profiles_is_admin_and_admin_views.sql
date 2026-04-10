-- Admin flag on profiles, helper is_admin(), immutability for clients, and gate on admin_* views (DB-enforced).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_admin IS
  'When true, the user may query admin Winlab views (e.g. admin_lotteries_overview). Only service_role or a direct postgres-class session should change this value.';

CREATE INDEX IF NOT EXISTS profiles_is_admin_true_idx
  ON public.profiles (id)
  WHERE is_admin = true;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
      AND is_admin = true
  );
$$;

ALTER FUNCTION public.is_admin(uuid) OWNER TO postgres;

COMMENT ON FUNCTION public.is_admin(uuid) IS
  'Returns true when profiles.is_admin is true for the given user id (typically auth.uid()). Used by admin views and RLS.';

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.profiles_enforce_is_admin_gate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  jwt_role text := nullif(current_setting('request.jwt.claim.role', true), '');
  privileged boolean :=
    jwt_role = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin');
BEGIN
  IF tg_op = 'INSERT' THEN
    IF new.is_admin IS TRUE AND NOT privileged THEN
      new.is_admin := false;
    END IF;
    RETURN new;
  END IF;

  IF tg_op = 'UPDATE' AND new.is_admin IS DISTINCT FROM old.is_admin AND NOT privileged THEN
    RAISE EXCEPTION 'profiles.is_admin cannot be changed by this role'
      USING ERRCODE = '42501';
  END IF;

  RETURN new;
END;
$$;

ALTER FUNCTION public.profiles_enforce_is_admin_gate() OWNER TO postgres;

DROP TRIGGER IF EXISTS profiles_enforce_is_admin_gate ON public.profiles;

CREATE TRIGGER profiles_enforce_is_admin_gate
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_enforce_is_admin_gate();

-- Admin views are owned by postgres, so underlying table RLS is bypassed unless security_invoker is set.
-- Filter here (same predicate as a typical RLS USING clause) so only admins see rows.
CREATE OR REPLACE VIEW public.admin_lotteries_overview AS
SELECT
  l.id AS lottery_id,
  l.title,
  l.status,
  l.starts_at,
  l.ends_at,
  l.draw_at,
  l.ticket_cost,
  l.number_of_winners,
  b.name AS brand_name,
  COALESCE(tc.tickets_count, 0)::bigint AS tickets_count,
  COALESCE(wc.winners_count, 0)::bigint AS winners_count
FROM public.lotteries l
LEFT JOIN public.brands b
  ON b.id = l.brand_id
LEFT JOIN (
  SELECT
    lt.lottery_id,
    COUNT(*)::bigint AS tickets_count
  FROM public.lottery_tickets lt
  GROUP BY lt.lottery_id
) tc
  ON tc.lottery_id = l.id
LEFT JOIN (
  SELECT
    lw.lottery_id,
    COUNT(*)::bigint AS winners_count
  FROM public.lottery_winners lw
  GROUP BY lw.lottery_id
) wc
  ON wc.lottery_id = l.id
WHERE public.is_admin((SELECT auth.uid()));

ALTER VIEW public.admin_lotteries_overview OWNER TO postgres;

COMMENT ON VIEW public.admin_lotteries_overview IS
  'Admin Winlab : synthèse par loterie (libellés, dates, coût, marque, nombre de tickets et de gagnants). Lecture réservée aux profils is_admin (filtre sur la vue).';

CREATE OR REPLACE VIEW public.admin_lottery_detail AS
SELECT
  l.id AS lottery_id,
  l.title,
  l.description,
  l.short_description,
  l.status,
  l.category,
  l.slug,
  l.is_featured,
  l.ticket_cost,
  l.number_of_winners,
  l.starts_at,
  l.ends_at,
  l.draw_at,
  b.name AS brand_name,
  COALESCE(tc.tickets_count, 0)::bigint AS tickets_count,
  COALESCE(wc.winners_count, 0)::bigint AS winners_count,
  COALESCE(
    wj.winners,
    '[]'::jsonb
  ) AS winners
FROM public.lotteries l
LEFT JOIN public.brands b
  ON b.id = l.brand_id
LEFT JOIN (
  SELECT
    lt.lottery_id,
    COUNT(*)::bigint AS tickets_count
  FROM public.lottery_tickets lt
  GROUP BY lt.lottery_id
) tc
  ON tc.lottery_id = l.id
LEFT JOIN (
  SELECT
    lw.lottery_id,
    COUNT(*)::bigint AS winners_count
  FROM public.lottery_winners lw
  GROUP BY lw.lottery_id
) wc
  ON wc.lottery_id = l.id
LEFT JOIN (
  SELECT
    lw.lottery_id,
    jsonb_agg(
      jsonb_build_object(
        'position', lw.position,
        'user_id', lw.user_id,
        'username', p.username,
        'email', p.email,
        'ticket_id', lw.ticket_id,
        'created_at', lw.created_at
      )
      ORDER BY lw.position ASC
    ) AS winners
  FROM public.lottery_winners lw
  LEFT JOIN public.profiles p
    ON p.id = lw.user_id
  GROUP BY lw.lottery_id
) wj
  ON wj.lottery_id = l.id
WHERE public.is_admin((SELECT auth.uid()));

ALTER VIEW public.admin_lottery_detail OWNER TO postgres;

COMMENT ON VIEW public.admin_lottery_detail IS
  'Admin Winlab : détail d’une loterie par ligne (infos, marque, comptages, tableau JSON des gagnants trié par position). Lecture réservée aux profils is_admin (filtre sur la vue).';
