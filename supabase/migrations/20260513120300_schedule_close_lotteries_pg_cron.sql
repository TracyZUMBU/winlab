-- Planifie la fermeture batch des loteries actives après ends_at (toutes les 5 minutes).
-- Nécessite l’extension pg_cron (disponible sur les projets Supabase ; activée en local avec le stack actuel).

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
DECLARE
  j record;
BEGIN
  FOR j IN
    SELECT jobid
    FROM cron.job
    WHERE jobname = 'close-lotteries-past-ends-at'
  LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'close-lotteries-past-ends-at',
  '*/5 * * * *',
  $job$SELECT public.close_lotteries_past_ends_at();$job$
);
