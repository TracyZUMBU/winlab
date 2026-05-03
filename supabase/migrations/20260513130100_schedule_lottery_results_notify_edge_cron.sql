-- Planifie l’appel HTTP vers l’Edge `lottery-results-notify-cron` (toutes les 5 minutes).
-- Vault : en plus de `supabase_url` et `supabase_service_role_key`, créer un secret
-- `lottery_results_notify_cron_secret` (même valeur que le secret Edge
-- `LOTTERY_RESULTS_NOTIFY_CRON_SECRET`). Sans ce trio, la fonction no-op avec WARNING.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

GRANT SELECT ON vault.decrypted_secrets TO postgres;

CREATE OR REPLACE FUNCTION public.lottery_results_notify_invoke_edge_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_url text;
  v_service_key text;
  v_cron_secret text;
BEGIN
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

  SELECT decrypted_secret
  INTO v_cron_secret
  FROM vault.decrypted_secrets
  WHERE name = 'lottery_results_notify_cron_secret'
  LIMIT 1;

  IF v_base_url IS NULL OR v_service_key IS NULL OR v_cron_secret IS NULL THEN
    RAISE WARNING
      'lottery_results_notify_invoke_edge_cron skipped: secrets Vault manquants (supabase_url, supabase_service_role_key, lottery_results_notify_cron_secret)';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := rtrim(v_base_url, '/') || '/functions/v1/lottery-results-notify-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key,
      'apikey', v_service_key,
      'X-Winlab-Cron-Secret', v_cron_secret
    ),
    body := '{}'::jsonb
  );
END;
$$;

ALTER FUNCTION public.lottery_results_notify_invoke_edge_cron() OWNER TO postgres;

COMMENT ON FUNCTION public.lottery_results_notify_invoke_edge_cron() IS
  'POST pg_net vers lottery-results-notify-cron (Vault : supabase_url, supabase_service_role_key, lottery_results_notify_cron_secret).';

REVOKE ALL ON FUNCTION public.lottery_results_notify_invoke_edge_cron() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lottery_results_notify_invoke_edge_cron() TO postgres;

DO $$
DECLARE
  j record;
BEGIN
  FOR j IN
    SELECT jobid
    FROM cron.job
    WHERE jobname = 'lottery-results-notify-cron'
  LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'lottery-results-notify-cron',
  '*/5 * * * *',
  $job$SELECT public.lottery_results_notify_invoke_edge_cron();$job$
);
