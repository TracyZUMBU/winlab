-- Appel HTTP (pg_net) vers l’Edge `lottery-results-notify-cron` ; secrets lus dans le Vault.
-- Miroir logique : migration 20260513130100_schedule_lottery_results_notify_edge_cron.sql

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
