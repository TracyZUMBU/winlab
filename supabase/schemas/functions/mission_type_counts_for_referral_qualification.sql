-- Types de missions qui NE comptent PAS pour la première complétion qualifiant le bonus parrain.
-- Ajouter des valeurs dans le tableau ci‑dessous via une nouvelle migration quand un nouveau
-- mission_type système (ex. récompense à la connexion) doit être exclu.

DROP FUNCTION IF EXISTS public.mission_type_counts_for_referral_qualification(public.mission_type);

CREATE FUNCTION public.mission_type_counts_for_referral_qualification(
  p_mission_type public.mission_type
)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT NOT (
    p_mission_type = ANY (
      ARRAY[
        'daily_login'::public.mission_type
      ]
    )
  );
$$;

ALTER FUNCTION public.mission_type_counts_for_referral_qualification(public.mission_type) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.mission_type_counts_for_referral_qualification(public.mission_type) FROM PUBLIC;
