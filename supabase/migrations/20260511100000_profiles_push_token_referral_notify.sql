-- Push tokens + referral qualified → Edge Function (Expo push) via pg_net.
-- Secrets : Dashboard → Vault → secrets `supabase_url` et `supabase_service_role_key`
-- (pas de secrets en dur dans le dépôt).

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token text;

GRANT SELECT ON vault.decrypted_secrets TO postgres;

CREATE OR REPLACE FUNCTION public.notify_referral_reward()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_url text;
  v_service_key text;
BEGIN
  IF NEW.status IS DISTINCT FROM 'qualified'
     OR OLD.status IS NOT DISTINCT FROM 'qualified' THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret
    INTO v_base_url
    FROM vault.decrypted_secrets
   WHERE name = 'supabase_url'
   LIMIT 1;

  SELECT decrypted_secret
    INTO v_service_key
    FROM vault.decrypted_secrets
   WHERE name = 'supabase_service_role_key'
   LIMIT 1;

  IF v_base_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING 'notify_referral_reward skipped: secrets manquants dans le Vault (supabase_url ou supabase_service_role_key)';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := rtrim(v_base_url, '/') || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.referrer_user_id,
      'title', '🎉 Parrainage validé !',
      'body', 'Ton ami a rejoint Winlab. Tes tokens ont été crédités !',
      'data', jsonb_build_object(
        'type', 'referral_reward',
        'referral_id', NEW.id
      )
    )
  );

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.notify_referral_reward() OWNER TO postgres;

REVOKE ALL ON FUNCTION public.notify_referral_reward() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_referral_qualified ON public.referrals;

CREATE TRIGGER on_referral_qualified
  AFTER UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_referral_reward();

-- Pattern futurs événements : nouvelle fonction SQL (+ trigger) qui lit les mêmes
-- secrets Vault et appelle la même Edge Function `send-push-notification`.
