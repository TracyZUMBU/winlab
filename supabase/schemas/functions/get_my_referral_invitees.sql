-- Liste des filleuls pour le hub parrainage (RLS profiles ne permet pas au parrain de lire les profils des filleuls en direct).

DROP FUNCTION IF EXISTS public.get_my_referral_invitees();

CREATE FUNCTION public.get_my_referral_invitees()
RETURNS TABLE (
  referral_id uuid,
  status public.referral_status,
  qualified_at timestamp with time zone,
  created_at timestamp with time zone,
  referred_username text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select
    r.id as referral_id,
    r.status,
    r.qualified_at,
    r.created_at,
    case
      when p.username is null then null::text
      when trim(p.username) = '' then null::text
      else trim(p.username)::text
    end as referred_username
  from public.referrals r
  left join public.profiles p on p.id = r.referred_user_id
  where r.referrer_user_id = auth.uid()
  order by r.created_at desc;
$$;

ALTER FUNCTION public.get_my_referral_invitees() OWNER TO postgres;

REVOKE ALL ON FUNCTION public.get_my_referral_invitees() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_referral_invitees() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_referral_invitees() TO service_role;
