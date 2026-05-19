-- Conflict-safe slug allocation: retry INSERT on lotteries_slug_unique instead of SELECT-then-INSERT.

DROP FUNCTION IF EXISTS public.admin_lottery_resolve_unique_slug(text);

CREATE OR REPLACE FUNCTION public.admin_create_lottery(
  p_brand_id uuid,
  p_title text,
  p_ticket_cost integer,
  p_number_of_winners integer,
  p_ends_at timestamptz,
  p_draw_at timestamptz,
  p_starts_at timestamptz DEFAULT NULL,
  p_status public.lottery_status DEFAULT 'draft',
  p_description text DEFAULT NULL,
  p_short_description text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_image_url text DEFAULT NULL,
  p_is_featured boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_title text;
  v_base text;
  v_slug text;
  v_suffix integer := 2;
  v_lottery_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'WINLAB_ADMIN_REQUIRED'
      USING ERRCODE = '42501';
  END IF;

  IF p_brand_id IS NULL THEN
    RAISE EXCEPTION 'WINLAB_INVALID_BRAND_ID'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.brands b
    WHERE b.id = p_brand_id
  ) THEN
    RAISE EXCEPTION 'WINLAB_INVALID_BRAND_ID'
      USING ERRCODE = '22023';
  END IF;

  v_title := btrim(coalesce(p_title, ''));

  IF char_length(v_title) = 0 THEN
    RAISE EXCEPTION 'WINLAB_INVALID_TITLE'
      USING ERRCODE = '22023';
  END IF;

  IF p_ticket_cost IS NULL OR p_ticket_cost <= 0 THEN
    RAISE EXCEPTION 'WINLAB_INVALID_TICKET_COST'
      USING ERRCODE = '22023';
  END IF;

  IF p_number_of_winners IS NULL OR p_number_of_winners <= 0 THEN
    RAISE EXCEPTION 'WINLAB_INVALID_NUMBER_OF_WINNERS'
      USING ERRCODE = '22023';
  END IF;

  IF p_ends_at IS NULL OR p_draw_at IS NULL THEN
    RAISE EXCEPTION 'WINLAB_INVALID_LOTTERY_DATES'
      USING ERRCODE = '22023';
  END IF;

  IF p_status = 'cancelled'::public.lottery_status THEN
    RAISE EXCEPTION 'WINLAB_INVALID_LOTTERY_STATUS'
      USING ERRCODE = '22023';
  END IF;

  IF p_starts_at IS NOT NULL AND p_starts_at >= p_ends_at THEN
    RAISE EXCEPTION 'WINLAB_INVALID_LOTTERY_DATES'
      USING ERRCODE = '22023';
  END IF;

  IF p_starts_at IS NOT NULL AND p_starts_at >= p_draw_at THEN
    RAISE EXCEPTION 'WINLAB_INVALID_LOTTERY_DATES'
      USING ERRCODE = '22023';
  END IF;

  IF p_ends_at > p_draw_at THEN
    RAISE EXCEPTION 'WINLAB_INVALID_LOTTERY_DATES'
      USING ERRCODE = '22023';
  END IF;

  v_base := public.admin_lottery_slug_from_title(v_title);

  IF v_base IS NULL OR char_length(v_base) = 0 THEN
    v_base := 'lottery-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  END IF;

  v_slug := v_base;

  LOOP
    INSERT INTO public.lotteries (
      brand_id,
      title,
      slug,
      description,
      short_description,
      category,
      image_url,
      ticket_cost,
      number_of_winners,
      status,
      starts_at,
      ends_at,
      draw_at,
      is_featured
    )
    VALUES (
      p_brand_id,
      v_title,
      v_slug,
      NULLIF(btrim(coalesce(p_description, '')), ''),
      NULLIF(btrim(coalesce(p_short_description, '')), ''),
      NULLIF(btrim(coalesce(p_category, '')), ''),
      NULLIF(btrim(coalesce(p_image_url, '')), ''),
      p_ticket_cost,
      p_number_of_winners,
      coalesce(p_status, 'draft'::public.lottery_status),
      p_starts_at,
      p_ends_at,
      p_draw_at,
      coalesce(p_is_featured, false)
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO v_lottery_id;

    IF v_lottery_id IS NOT NULL THEN
      EXIT;
    END IF;

    v_slug := v_base || '-' || v_suffix::text;
    v_suffix := v_suffix + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'lottery_id', v_lottery_id,
    'slug', v_slug
  );
END;
$$;

ALTER FUNCTION public.admin_create_lottery(
  uuid,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz,
  public.lottery_status,
  text,
  text,
  text,
  text,
  boolean
) OWNER TO postgres;

COMMENT ON FUNCTION public.admin_create_lottery(
  uuid,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz,
  public.lottery_status,
  text,
  text,
  text,
  text,
  boolean
) IS
  'Backoffice: create a lottery. Caller must be profiles.is_admin. Slug is derived from title; on slug collision, retries INSERT with -2, -3, … suffixes.';
