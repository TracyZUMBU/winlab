drop view if exists "public"."admin_lotteries_overview";

alter type "public"."meal_type" rename to "meal_type__old_version_to_be_dropped";

create type "public"."meal_type" as enum ('breakfast', 'lunch', 'dinner', 'snack');

alter table "public"."weekly_meals" alter column meal_type type "public"."meal_type" using meal_type::text::"public"."meal_type";

drop type "public"."meal_type__old_version_to_be_dropped";

alter table "public"."lotteries" add column "is_featured" boolean not null default false;

alter table "public"."lotteries" add column "short_description" text;

alter table "public"."lotteries" alter column "brand_id" set default '654aa4ef-9cef-442f-94e2-398a5774ab62'::uuid;

alter table "public"."missions" add column "image_url" text;

alter table "public"."profiles" add column "avatar_url" text;

CREATE INDEX lotteries_is_featured_true_idx ON public.lotteries USING btree (is_featured) WHERE (is_featured = true);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_todo_missions_page(p_limit integer, p_offset integer)
 RETURNS TABLE(id uuid, title text, description text, mission_type public.mission_type, token_reward integer, ends_at timestamp with time zone, image_url text, brand jsonb, mission_completions jsonb)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_active_ticket_counts_by_lottery(p_lottery_ids uuid[])
 RETURNS TABLE(lottery_id uuid, active_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: you must be logged in';
  END IF;

  RETURN QUERY
  WITH input_ids AS (
    SELECT DISTINCT unnest(p_lottery_ids) AS lottery_id
  )
  SELECT
    input_ids.lottery_id,
    COUNT(lt.id)::bigint AS active_count
  FROM input_ids
  LEFT JOIN public.lottery_tickets lt
    ON lt.lottery_id = input_ids.lottery_id
   AND lt.status = 'active'
   AND lt.user_id = v_uid
  GROUP BY input_ids.lottery_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_home_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      AND NOT EXISTS (
        SELECT 1
        FROM public.mission_completions mca
        WHERE mca.mission_id = m.id
          AND mca.user_id = v_uid
          AND mca.status = 'approved'::public.mission_completion_status
      )
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_wallet_transactions_enriched()
 RETURNS TABLE(id uuid, amount integer, direction public.wallet_direction, transaction_type public.wallet_transaction_type, reference_type public.wallet_reference_type, reference_id uuid, created_at timestamp with time zone, context_title text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    wt.id,
    wt.amount,
    wt.direction,
    wt.transaction_type,
    wt.reference_type,
    wt.reference_id,
    wt.created_at,
    COALESCE(
      m.title,
      lo.title,
      ref.referral_code,
      (
        SELECT m2.title
        FROM public.mission_completions mc2
        INNER JOIN public.missions m2 ON m2.id = mc2.mission_id
        WHERE mc2.reward_transaction_id = wt.id
        ORDER BY mc2.created_at DESC, mc2.id DESC
        LIMIT 1
      ),
      (
        SELECT l2.title
        FROM public.lottery_tickets ltx
        INNER JOIN public.lotteries l2 ON l2.id = ltx.lottery_id
        WHERE ltx.wallet_transaction_id = wt.id
        ORDER BY ltx.created_at DESC, ltx.id DESC
        LIMIT 1
      )
    ) AS context_title
  FROM public.wallet_transactions wt
  LEFT JOIN public.mission_completions mc
    ON wt.reference_type = 'mission_completion'::public.wallet_reference_type
    AND wt.reference_id = mc.id
  LEFT JOIN public.missions m
    ON m.id = mc.mission_id
  LEFT JOIN public.lottery_tickets lt
    ON wt.reference_type = 'lottery_ticket'::public.wallet_reference_type
    AND wt.reference_id = lt.id
  LEFT JOIN public.lotteries lo
    ON lo.id = lt.lottery_id
  LEFT JOIN public.referrals ref
    ON wt.reference_type = 'referral'::public.wallet_reference_type
    AND wt.reference_id = ref.id
    AND ref.referrer_user_id = wt.user_id
  WHERE wt.user_id = auth.uid()
  ORDER BY wt.created_at DESC;
END;
$function$
;


  create policy "Users can view missions they have a completion for"
  on "public"."missions"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.mission_completions mc
  WHERE ((mc.mission_id = missions.id) AND (mc.user_id = auth.uid())))));



