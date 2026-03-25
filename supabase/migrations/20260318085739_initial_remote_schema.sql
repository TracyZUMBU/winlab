


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."lottery_status" AS ENUM (
    'draft',
    'active',
    'closed',
    'drawn',
    'cancelled'
);


ALTER TYPE "public"."lottery_status" OWNER TO "postgres";


CREATE TYPE "public"."lottery_ticket_status" AS ENUM (
    'active',
    'cancelled'
);


ALTER TYPE "public"."lottery_ticket_status" OWNER TO "postgres";


CREATE TYPE "public"."meal_type" AS ENUM (
    'breakfast',
    'lunch',
    'dinner'
);


ALTER TYPE "public"."meal_type" OWNER TO "postgres";


CREATE TYPE "public"."mission_completion_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "public"."mission_completion_status" OWNER TO "postgres";


CREATE TYPE "public"."mission_status" AS ENUM (
    'draft',
    'active',
    'paused',
    'archived'
);


ALTER TYPE "public"."mission_status" OWNER TO "postgres";


CREATE TYPE "public"."mission_type" AS ENUM (
    'survey',
    'video',
    'follow',
    'referral',
    'custom'
);


ALTER TYPE "public"."mission_type" OWNER TO "postgres";


CREATE TYPE "public"."mission_validation_mode" AS ENUM (
    'automatic',
    'manual'
);


ALTER TYPE "public"."mission_validation_mode" OWNER TO "postgres";


CREATE TYPE "public"."referral_status" AS ENUM (
    'pending',
    'qualified',
    'rewarded',
    'cancelled'
);


ALTER TYPE "public"."referral_status" OWNER TO "postgres";


CREATE TYPE "public"."unit_type" AS ENUM (
    'weight',
    'volume',
    'count'
);


ALTER TYPE "public"."unit_type" OWNER TO "postgres";


CREATE TYPE "public"."wallet_direction" AS ENUM (
    'credit',
    'debit'
);


ALTER TYPE "public"."wallet_direction" OWNER TO "postgres";


CREATE TYPE "public"."wallet_reference_type" AS ENUM (
    'mission_completion',
    'lottery_ticket',
    'referral',
    'purchase',
    'admin'
);


ALTER TYPE "public"."wallet_reference_type" OWNER TO "postgres";


CREATE TYPE "public"."wallet_transaction_type" AS ENUM (
    'mission_reward',
    'ticket_purchase',
    'referral_bonus',
    'token_purchase',
    'manual_adjustment'
);


ALTER TYPE "public"."wallet_transaction_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_mission_completion"("p_completion_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_completion public.mission_completions%rowtype;
  v_mission public.missions%rowtype;
  v_transaction_id uuid;
begin
  select *
  into v_completion
  from public.mission_completions
  where id = p_completion_id
  for update;

  if not found then
    raise exception 'Mission completion not found';
  end if;

  if v_completion.status = 'rejected' then
    raise exception 'Cannot approve a rejected mission completion';
  end if;

  if v_completion.reward_transaction_id is not null then
    raise exception 'Mission completion already rewarded';
  end if;

  select *
  into v_mission
  from public.missions
  where id = v_completion.mission_id;

  if not found then
    raise exception 'Mission not found';
  end if;

  update public.mission_completions
  set
    status = 'approved',
    reviewed_at = now(),
    updated_at = now()
  where id = p_completion_id;

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

  update public.mission_completions
  set
    reward_transaction_id = v_transaction_id,
    updated_at = now()
  where id = p_completion_id;

  perform public.handle_referral_after_first_mission(v_completion.user_id);
end;
$$;


ALTER FUNCTION "public"."approve_mission_completion"("p_completion_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_referral_after_first_mission"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_referral public.referrals%rowtype;
  v_approved_count integer;
  v_transaction_id uuid;
begin
  select count(*)
  into v_approved_count
  from public.mission_completions
  where user_id = p_user_id
    and status = 'approved'
    and reward_transaction_id is not null;

  if v_approved_count <> 1 then
    return;
  end if;

  select *
  into v_referral
  from public.referrals
  where referred_user_id = p_user_id
    and status = 'pending'
  for update;

  if not found then
    return;
  end if;

  update public.referrals
  set
    status = 'qualified',
    qualified_at = now(),
    updated_at = now()
  where id = v_referral.id;

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
    v_referral.referrer_user_id,
    30,
    'credit',
    'referral_bonus',
    'referral',
    v_referral.id,
    'Referral bonus'
  )
  returning id into v_transaction_id;

  update public.referrals
  set
    status = 'rewarded',
    reward_transaction_id = v_transaction_id,
    updated_at = now()
  where id = v_referral.id;
end;
$$;


ALTER FUNCTION "public"."handle_referral_after_first_mission"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."regenerate_grocery_list"("p_week_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- Overwrite week list (simple MVP behavior)
  delete from public.grocery_list_items
  where week_id = p_week_id;

  insert into public.grocery_list_items (
    week_id,
    ingredient_id,
    unit_id,
    quantity,
    is_checked
  )
  select
    wm.week_id,
    ri.ingredient_id,
    ri.unit_id,
    sum(
      ri.quantity
      * (wm.planned_servings::numeric / r.base_servings::numeric)
    ) as quantity,
    false as is_checked
  from public.weekly_meals wm
  join public.recipes r
    on r.id = wm.recipe_id
  join public.recipe_ingredients ri
    on ri.recipe_id = wm.recipe_id
  where wm.week_id = p_week_id
  group by
    wm.week_id,
    ri.ingredient_id,
    ri.unit_id;
end;
$$;


ALTER FUNCTION "public"."regenerate_grocery_list"("p_week_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_mission_completion"("p_mission_id" "uuid", "p_proof_data" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_user_id uuid;
  v_mission public.missions%rowtype;
  v_completion_id uuid;
  v_existing_count integer;
  v_total_count integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'User not authenticated';
  end if;

  select *
  into v_mission
  from public.missions
  where id = p_mission_id;

  if not found then
    raise exception 'Mission not found';
  end if;

  if v_mission.status <> 'active' then
    raise exception 'Mission not active';
  end if;

  if v_mission.starts_at is not null and v_mission.starts_at > now() then
    raise exception 'Mission not started yet';
  end if;

  if v_mission.ends_at is not null and v_mission.ends_at < now() then
    raise exception 'Mission expired';
  end if;

  select count(*)
  into v_existing_count
  from public.mission_completions
  where mission_id = p_mission_id
    and user_id = v_user_id
    and status in ('pending', 'approved');

  if v_existing_count >= v_mission.max_completions_per_user then
    raise exception 'Mission completion limit reached for this user';
  end if;

  if v_mission.max_completions_total is not null then
    select count(*)
    into v_total_count
    from public.mission_completions
    where mission_id = p_mission_id
      and status in ('pending', 'approved');

    if v_total_count >= v_mission.max_completions_total then
      raise exception 'Mission completion limit reached';
    end if;
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

  return v_completion_id;
end;
$$;


ALTER FUNCTION "public"."submit_mission_completion"("p_mission_id" "uuid", "p_proof_data" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."brands" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "logo_url" "text",
    "website_url" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "brands_name_not_empty" CHECK (("char_length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "brands_slug_not_empty" CHECK (("char_length"(TRIM(BOTH FROM "slug")) > 0))
);


ALTER TABLE "public"."brands" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grocery_list_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "week_id" "uuid" NOT NULL,
    "ingredient_id" "uuid" NOT NULL,
    "unit_id" "uuid" NOT NULL,
    "quantity" numeric NOT NULL,
    "is_checked" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "grocery_list_items_quantity_check" CHECK (("quantity" >= (0)::numeric))
);


ALTER TABLE "public"."grocery_list_items" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."grocery_list_merged" AS
 SELECT "week_id",
    "ingredient_id",
    "unit_id",
    "sum"("quantity") AS "total_quantity"
   FROM "public"."grocery_list_items"
  GROUP BY "week_id", "ingredient_id", "unit_id";


ALTER VIEW "public"."grocery_list_merged" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ingredient_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ingredient_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "default_unit_id" "uuid"
);


ALTER TABLE "public"."ingredients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lotteries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "image_url" "text",
    "ticket_cost" integer NOT NULL,
    "number_of_winners" integer DEFAULT 1 NOT NULL,
    "status" "public"."lottery_status" DEFAULT 'draft'::"public"."lottery_status" NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "draw_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slug" "text",
    CONSTRAINT "lotteries_dates_are_valid" CHECK (((("starts_at" IS NULL) OR ("ends_at" IS NULL) OR ("starts_at" < "ends_at")) AND (("starts_at" IS NULL) OR ("starts_at" < "draw_at")) AND (("ends_at" IS NULL) OR ("ends_at" <= "draw_at")))),
    CONSTRAINT "lotteries_number_of_winners_positive" CHECK (("number_of_winners" > 0)),
    CONSTRAINT "lotteries_slug_not_empty" CHECK ((("slug" IS NULL) OR ("char_length"(TRIM(BOTH FROM "slug")) > 0))),
    CONSTRAINT "lotteries_ticket_cost_positive" CHECK (("ticket_cost" > 0)),
    CONSTRAINT "lotteries_title_not_empty" CHECK (("char_length"(TRIM(BOTH FROM "title")) > 0))
);


ALTER TABLE "public"."lotteries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lottery_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lottery_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "wallet_transaction_id" "uuid",
    "status" "public"."lottery_ticket_status" DEFAULT 'active'::"public"."lottery_ticket_status" NOT NULL,
    "purchased_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lottery_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lottery_winners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lottery_id" "uuid" NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "lottery_winners_position_positive" CHECK (("position" > 0))
);


ALTER TABLE "public"."lottery_winners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meal_prep_weeks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "week_start_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."meal_prep_weeks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mission_completions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mission_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."mission_completion_status" DEFAULT 'pending'::"public"."mission_completion_status" NOT NULL,
    "completed_at" timestamp with time zone,
    "reviewed_at" timestamp with time zone,
    "reward_transaction_id" "uuid",
    "proof_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mission_completions_reviewed_after_created" CHECK ((("reviewed_at" IS NULL) OR ("reviewed_at" >= "created_at")))
);


ALTER TABLE "public"."mission_completions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."missions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "mission_type" "public"."mission_type" NOT NULL,
    "token_reward" integer NOT NULL,
    "status" "public"."mission_status" DEFAULT 'draft'::"public"."mission_status" NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "max_completions_total" integer,
    "max_completions_per_user" integer DEFAULT 1 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "validation_mode" "public"."mission_validation_mode" DEFAULT 'manual'::"public"."mission_validation_mode" NOT NULL,
    CONSTRAINT "missions_dates_are_valid" CHECK ((("starts_at" IS NULL) OR ("ends_at" IS NULL) OR ("starts_at" < "ends_at"))),
    CONSTRAINT "missions_max_completions_per_user_positive" CHECK (("max_completions_per_user" > 0)),
    CONSTRAINT "missions_max_completions_total_positive" CHECK ((("max_completions_total" IS NULL) OR ("max_completions_total" > 0))),
    CONSTRAINT "missions_title_not_empty" CHECK (("char_length"(TRIM(BOTH FROM "title")) > 0)),
    CONSTRAINT "missions_token_reward_positive" CHECK (("token_reward" > 0))
);


ALTER TABLE "public"."missions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "username" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "referral_code" "text",
    CONSTRAINT "profiles_referral_code_not_empty" CHECK ((("referral_code" IS NULL) OR ("char_length"(TRIM(BOTH FROM "referral_code")) >= 4))),
    CONSTRAINT "username_length_check" CHECK (("char_length"("username") >= 3))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipe_ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "ingredient_id" "uuid" NOT NULL,
    "unit_id" "uuid" NOT NULL,
    "quantity" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "recipe_ingredients_quantity_check" CHECK (("quantity" >= (0)::numeric))
);


ALTER TABLE "public"."recipe_ingredients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "image_url" "text",
    "calories" integer,
    "base_servings" integer NOT NULL,
    "notes" "text",
    "youtube_url" "text",
    "instagram_url" "text",
    "external_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "meal_type" "text",
    CONSTRAINT "recipes_base_servings_check" CHECK (("base_servings" > 0))
);


ALTER TABLE "public"."recipes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_user_id" "uuid" NOT NULL,
    "referred_user_id" "uuid" NOT NULL,
    "referral_code" "text" NOT NULL,
    "status" "public"."referral_status" DEFAULT 'pending'::"public"."referral_status" NOT NULL,
    "qualified_at" timestamp with time zone,
    "reward_transaction_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "referrals_no_self_referral" CHECK (("referrer_user_id" <> "referred_user_id"))
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."units" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "label" "text" NOT NULL,
    "type" "public"."unit_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."units" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallet_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "direction" "public"."wallet_direction" NOT NULL,
    "transaction_type" "public"."wallet_transaction_type" NOT NULL,
    "reference_type" "public"."wallet_reference_type",
    "reference_id" "uuid",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "wallet_amount_positive" CHECK (("amount" > 0)),
    CONSTRAINT "wallet_direction_valid" CHECK (("direction" = ANY (ARRAY['credit'::"public"."wallet_direction", 'debit'::"public"."wallet_direction"])))
);


ALTER TABLE "public"."wallet_transactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_wallet_balance" AS
 SELECT "p"."id" AS "user_id",
    COALESCE("sum"(
        CASE
            WHEN ("wt"."direction" = 'credit'::"public"."wallet_direction") THEN "wt"."amount"
            WHEN ("wt"."direction" = 'debit'::"public"."wallet_direction") THEN (- "wt"."amount")
            ELSE NULL::integer
        END), (0)::bigint) AS "balance"
   FROM ("public"."profiles" "p"
     LEFT JOIN "public"."wallet_transactions" "wt" ON (("wt"."user_id" = "p"."id")))
  GROUP BY "p"."id";


ALTER VIEW "public"."user_wallet_balance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weekly_meal_prep" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "servings" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "weekly_meal_prep_servings_check" CHECK (("servings" > 0))
);


ALTER TABLE "public"."weekly_meal_prep" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weekly_meals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "week_id" "uuid" NOT NULL,
    "meal_type" "public"."meal_type" NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "planned_servings" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "weekly_meals_planned_servings_check" CHECK (("planned_servings" > 0))
);


ALTER TABLE "public"."weekly_meals" OWNER TO "postgres";


ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."grocery_list_items"
    ADD CONSTRAINT "grocery_item_unique" UNIQUE ("week_id", "ingredient_id", "unit_id");



ALTER TABLE ONLY "public"."grocery_list_items"
    ADD CONSTRAINT "grocery_list_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ingredient_categories"
    ADD CONSTRAINT "ingredient_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."ingredient_categories"
    ADD CONSTRAINT "ingredient_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lotteries"
    ADD CONSTRAINT "lotteries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lotteries"
    ADD CONSTRAINT "lotteries_slug_unique" UNIQUE ("slug");



ALTER TABLE ONLY "public"."lottery_tickets"
    ADD CONSTRAINT "lottery_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lottery_winners"
    ADD CONSTRAINT "lottery_winners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lottery_winners"
    ADD CONSTRAINT "lottery_winners_unique_position_per_lottery" UNIQUE ("lottery_id", "position");



ALTER TABLE ONLY "public"."lottery_winners"
    ADD CONSTRAINT "lottery_winners_unique_ticket" UNIQUE ("ticket_id");



ALTER TABLE ONLY "public"."meal_prep_weeks"
    ADD CONSTRAINT "meal_prep_weeks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meal_prep_weeks"
    ADD CONSTRAINT "meal_prep_weeks_week_start_date_key" UNIQUE ("week_start_date");



ALTER TABLE ONLY "public"."mission_completions"
    ADD CONSTRAINT "mission_completions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."missions"
    ADD CONSTRAINT "missions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referral_code_unique" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."recipe_ingredients"
    ADD CONSTRAINT "recipe_ingredient_unique" UNIQUE ("recipe_id", "ingredient_id", "unit_id");



ALTER TABLE ONLY "public"."recipe_ingredients"
    ADD CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_unique_referred_user" UNIQUE ("referred_user_id");



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_label_key" UNIQUE ("label");



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_meal_prep"
    ADD CONSTRAINT "weekly_meal_prep_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_meals"
    ADD CONSTRAINT "weekly_meals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_meals"
    ADD CONSTRAINT "weekly_meals_unique" UNIQUE ("week_id", "meal_type");



CREATE INDEX "grocery_list_items_ingredient_id_idx" ON "public"."grocery_list_items" USING "btree" ("ingredient_id");



CREATE INDEX "grocery_list_items_week_id_idx" ON "public"."grocery_list_items" USING "btree" ("week_id");



CREATE INDEX "ingredients_category_id_idx" ON "public"."ingredients" USING "btree" ("category_id");



CREATE INDEX "lotteries_brand_id_idx" ON "public"."lotteries" USING "btree" ("brand_id");



CREATE INDEX "lotteries_category_idx" ON "public"."lotteries" USING "btree" ("category");



CREATE INDEX "lotteries_draw_at_idx" ON "public"."lotteries" USING "btree" ("draw_at");



CREATE INDEX "lotteries_ends_at_idx" ON "public"."lotteries" USING "btree" ("ends_at");



CREATE INDEX "lotteries_starts_at_idx" ON "public"."lotteries" USING "btree" ("starts_at");



CREATE INDEX "lotteries_status_idx" ON "public"."lotteries" USING "btree" ("status");



CREATE INDEX "lottery_tickets_lottery_id_idx" ON "public"."lottery_tickets" USING "btree" ("lottery_id");



CREATE INDEX "lottery_tickets_purchased_at_idx" ON "public"."lottery_tickets" USING "btree" ("purchased_at");



CREATE INDEX "lottery_tickets_status_idx" ON "public"."lottery_tickets" USING "btree" ("status");



CREATE INDEX "lottery_tickets_user_id_idx" ON "public"."lottery_tickets" USING "btree" ("user_id");



CREATE INDEX "lottery_tickets_wallet_transaction_id_idx" ON "public"."lottery_tickets" USING "btree" ("wallet_transaction_id");



CREATE INDEX "lottery_winners_lottery_id_idx" ON "public"."lottery_winners" USING "btree" ("lottery_id");



CREATE INDEX "lottery_winners_user_id_idx" ON "public"."lottery_winners" USING "btree" ("user_id");



CREATE INDEX "mission_completions_created_at_idx" ON "public"."mission_completions" USING "btree" ("created_at");



CREATE INDEX "mission_completions_mission_id_idx" ON "public"."mission_completions" USING "btree" ("mission_id");



CREATE INDEX "mission_completions_status_idx" ON "public"."mission_completions" USING "btree" ("status");



CREATE INDEX "mission_completions_user_id_idx" ON "public"."mission_completions" USING "btree" ("user_id");



CREATE INDEX "missions_brand_id_idx" ON "public"."missions" USING "btree" ("brand_id");



CREATE INDEX "missions_ends_at_idx" ON "public"."missions" USING "btree" ("ends_at");



CREATE INDEX "missions_mission_type_idx" ON "public"."missions" USING "btree" ("mission_type");



CREATE INDEX "missions_starts_at_idx" ON "public"."missions" USING "btree" ("starts_at");



CREATE INDEX "missions_status_idx" ON "public"."missions" USING "btree" ("status");



CREATE INDEX "missions_validation_mode_idx" ON "public"."missions" USING "btree" ("validation_mode");



CREATE INDEX "profiles_username_idx" ON "public"."profiles" USING "btree" ("username");



CREATE INDEX "recipe_ingredients_ingredient_id_idx" ON "public"."recipe_ingredients" USING "btree" ("ingredient_id");



CREATE INDEX "recipe_ingredients_recipe_id_idx" ON "public"."recipe_ingredients" USING "btree" ("recipe_id");



CREATE INDEX "recipes_name_idx" ON "public"."recipes" USING "btree" ("name");



CREATE INDEX "referrals_referral_code_idx" ON "public"."referrals" USING "btree" ("referral_code");



CREATE INDEX "referrals_referred_user_id_idx" ON "public"."referrals" USING "btree" ("referred_user_id");



CREATE INDEX "referrals_referrer_user_id_idx" ON "public"."referrals" USING "btree" ("referrer_user_id");



CREATE INDEX "referrals_status_idx" ON "public"."referrals" USING "btree" ("status");



CREATE INDEX "wallet_transactions_created_at_idx" ON "public"."wallet_transactions" USING "btree" ("created_at");



CREATE INDEX "wallet_transactions_type_idx" ON "public"."wallet_transactions" USING "btree" ("transaction_type");



CREATE INDEX "wallet_transactions_user_id_idx" ON "public"."wallet_transactions" USING "btree" ("user_id");



CREATE INDEX "weekly_meals_recipe_id_idx" ON "public"."weekly_meals" USING "btree" ("recipe_id");



CREATE INDEX "weekly_meals_week_id_idx" ON "public"."weekly_meals" USING "btree" ("week_id");



CREATE OR REPLACE TRIGGER "update_brands_updated_at" BEFORE UPDATE ON "public"."brands" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_lotteries_updated_at" BEFORE UPDATE ON "public"."lotteries" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_mission_completions_updated_at" BEFORE UPDATE ON "public"."mission_completions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_missions_updated_at" BEFORE UPDATE ON "public"."missions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_referrals_updated_at" BEFORE UPDATE ON "public"."referrals" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."grocery_list_items"
    ADD CONSTRAINT "grocery_list_items_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."grocery_list_items"
    ADD CONSTRAINT "grocery_list_items_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."grocery_list_items"
    ADD CONSTRAINT "grocery_list_items_week_id_fkey" FOREIGN KEY ("week_id") REFERENCES "public"."meal_prep_weeks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."ingredient_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_default_unit_id_fkey" FOREIGN KEY ("default_unit_id") REFERENCES "public"."units"("id");



ALTER TABLE ONLY "public"."lotteries"
    ADD CONSTRAINT "lotteries_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lottery_tickets"
    ADD CONSTRAINT "lottery_tickets_lottery_id_fkey" FOREIGN KEY ("lottery_id") REFERENCES "public"."lotteries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lottery_tickets"
    ADD CONSTRAINT "lottery_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lottery_tickets"
    ADD CONSTRAINT "lottery_tickets_wallet_transaction_fk" FOREIGN KEY ("wallet_transaction_id") REFERENCES "public"."wallet_transactions"("id");



ALTER TABLE ONLY "public"."lottery_winners"
    ADD CONSTRAINT "lottery_winners_lottery_id_fkey" FOREIGN KEY ("lottery_id") REFERENCES "public"."lotteries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lottery_winners"
    ADD CONSTRAINT "lottery_winners_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."lottery_tickets"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lottery_winners"
    ADD CONSTRAINT "lottery_winners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mission_completions"
    ADD CONSTRAINT "mission_completions_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mission_completions"
    ADD CONSTRAINT "mission_completions_reward_fk" FOREIGN KEY ("reward_transaction_id") REFERENCES "public"."wallet_transactions"("id");



ALTER TABLE ONLY "public"."mission_completions"
    ADD CONSTRAINT "mission_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."missions"
    ADD CONSTRAINT "missions_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipe_ingredients"
    ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."recipe_ingredients"
    ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipe_ingredients"
    ADD CONSTRAINT "recipe_ingredients_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_user_id_fkey" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_reward_transaction_fk" FOREIGN KEY ("reward_transaction_id") REFERENCES "public"."wallet_transactions"("id");



ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weekly_meals"
    ADD CONSTRAINT "weekly_meals_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."weekly_meals"
    ADD CONSTRAINT "weekly_meals_week_id_fkey" FOREIGN KEY ("week_id") REFERENCES "public"."meal_prep_weeks"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated users can view active brands" ON "public"."brands" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Authenticated users can view available missions" ON "public"."missions" FOR SELECT TO "authenticated" USING ((("status" = 'active'::"public"."mission_status") AND (("starts_at" IS NULL) OR ("starts_at" <= "now"())) AND (("ends_at" IS NULL) OR ("ends_at" >= "now"()))));



CREATE POLICY "Authenticated users can view lottery winners" ON "public"."lottery_winners" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view non-draft lotteries" ON "public"."lotteries" FOR SELECT TO "authenticated" USING (("status" = ANY (ARRAY['active'::"public"."lottery_status", 'closed'::"public"."lottery_status", 'drawn'::"public"."lottery_status"])));



CREATE POLICY "Users can insert their own mission completions" ON "public"."mission_completions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own lottery tickets" ON "public"."lottery_tickets" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own mission completions" ON "public"."mission_completions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own referrals" ON "public"."referrals" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "referrer_user_id") OR ("auth"."uid"() = "referred_user_id")));



CREATE POLICY "Users can view their own wallet transactions" ON "public"."wallet_transactions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."brands" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lotteries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lottery_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lottery_winners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mission_completions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."missions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallet_transactions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































REVOKE ALL ON FUNCTION "public"."approve_mission_completion"("p_completion_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."approve_mission_completion"("p_completion_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_mission_completion"("p_completion_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_mission_completion"("p_completion_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_referral_after_first_mission"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_referral_after_first_mission"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_referral_after_first_mission"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."regenerate_grocery_list"("p_week_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."regenerate_grocery_list"("p_week_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regenerate_grocery_list"("p_week_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."submit_mission_completion"("p_mission_id" "uuid", "p_proof_data" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_mission_completion"("p_mission_id" "uuid", "p_proof_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_mission_completion"("p_mission_id" "uuid", "p_proof_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_mission_completion"("p_mission_id" "uuid", "p_proof_data" "jsonb") TO "service_role";


















GRANT ALL ON TABLE "public"."brands" TO "anon";
GRANT ALL ON TABLE "public"."brands" TO "authenticated";
GRANT ALL ON TABLE "public"."brands" TO "service_role";



GRANT ALL ON TABLE "public"."grocery_list_items" TO "anon";
GRANT ALL ON TABLE "public"."grocery_list_items" TO "authenticated";
GRANT ALL ON TABLE "public"."grocery_list_items" TO "service_role";



GRANT ALL ON TABLE "public"."grocery_list_merged" TO "anon";
GRANT ALL ON TABLE "public"."grocery_list_merged" TO "authenticated";
GRANT ALL ON TABLE "public"."grocery_list_merged" TO "service_role";



GRANT ALL ON TABLE "public"."ingredient_categories" TO "anon";
GRANT ALL ON TABLE "public"."ingredient_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."ingredient_categories" TO "service_role";



GRANT ALL ON TABLE "public"."ingredients" TO "anon";
GRANT ALL ON TABLE "public"."ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."ingredients" TO "service_role";



GRANT ALL ON TABLE "public"."lotteries" TO "anon";
GRANT ALL ON TABLE "public"."lotteries" TO "authenticated";
GRANT ALL ON TABLE "public"."lotteries" TO "service_role";



GRANT ALL ON TABLE "public"."lottery_tickets" TO "anon";
GRANT ALL ON TABLE "public"."lottery_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."lottery_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."lottery_winners" TO "anon";
GRANT ALL ON TABLE "public"."lottery_winners" TO "authenticated";
GRANT ALL ON TABLE "public"."lottery_winners" TO "service_role";



GRANT ALL ON TABLE "public"."meal_prep_weeks" TO "anon";
GRANT ALL ON TABLE "public"."meal_prep_weeks" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_prep_weeks" TO "service_role";



GRANT ALL ON TABLE "public"."mission_completions" TO "anon";
GRANT ALL ON TABLE "public"."mission_completions" TO "authenticated";
GRANT ALL ON TABLE "public"."mission_completions" TO "service_role";



GRANT ALL ON TABLE "public"."missions" TO "anon";
GRANT ALL ON TABLE "public"."missions" TO "authenticated";
GRANT ALL ON TABLE "public"."missions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."recipe_ingredients" TO "anon";
GRANT ALL ON TABLE "public"."recipe_ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_ingredients" TO "service_role";



GRANT ALL ON TABLE "public"."recipes" TO "anon";
GRANT ALL ON TABLE "public"."recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."recipes" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."units" TO "anon";
GRANT ALL ON TABLE "public"."units" TO "authenticated";
GRANT ALL ON TABLE "public"."units" TO "service_role";



GRANT ALL ON TABLE "public"."wallet_transactions" TO "anon";
GRANT ALL ON TABLE "public"."wallet_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_wallet_balance" TO "anon";
GRANT ALL ON TABLE "public"."user_wallet_balance" TO "authenticated";
GRANT ALL ON TABLE "public"."user_wallet_balance" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_meal_prep" TO "anon";
GRANT ALL ON TABLE "public"."weekly_meal_prep" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_meal_prep" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_meals" TO "anon";
GRANT ALL ON TABLE "public"."weekly_meals" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_meals" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


