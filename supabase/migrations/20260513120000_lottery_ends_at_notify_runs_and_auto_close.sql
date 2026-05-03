-- Phase A (loteries) : tables d'idempotence pour les notifs « résultats » (option 2),
-- ends_at NOT NULL, fermeture automatique active → closed quand ends_at <= now().

-- ---------------------------------------------------------------------------
-- 1) Tables notify runs / items (Edge cron planifiée — pas de RLS pour service_role)
-- ---------------------------------------------------------------------------
CREATE TABLE public.lottery_results_notify_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

COMMENT ON TABLE public.lottery_results_notify_runs IS
  'Vague de traitement pour les notifications push « résultats loterie » (option 2 idempotence).';

CREATE TABLE public.lottery_results_notify_run_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  run_id uuid NOT NULL REFERENCES public.lottery_results_notify_runs (id) ON DELETE CASCADE,
  lottery_id uuid NOT NULL REFERENCES public.lotteries (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lottery_results_notify_run_items_run_lottery_uniq UNIQUE (run_id, lottery_id)
);

COMMENT ON TABLE public.lottery_results_notify_run_items IS
  'Loterie incluse dans une vague ; une ligne completed par lottery_id (unicité partielle).';

CREATE INDEX lottery_results_notify_run_items_run_id_idx
  ON public.lottery_results_notify_run_items (run_id);

CREATE INDEX lottery_results_notify_run_items_lottery_id_idx
  ON public.lottery_results_notify_run_items (lottery_id);

CREATE UNIQUE INDEX lottery_results_notify_run_items_lottery_completed_uidx
  ON public.lottery_results_notify_run_items (lottery_id)
  WHERE (status = 'completed');

ALTER TABLE public.lottery_results_notify_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_results_notify_run_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.lottery_results_notify_runs FROM PUBLIC;
REVOKE ALL ON TABLE public.lottery_results_notify_run_items FROM PUBLIC;
REVOKE ALL ON TABLE public.lottery_results_notify_runs FROM anon, authenticated;
REVOKE ALL ON TABLE public.lottery_results_notify_run_items FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lottery_results_notify_runs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lottery_results_notify_run_items TO service_role;

ALTER TABLE public.lottery_results_notify_runs OWNER TO postgres;
ALTER TABLE public.lottery_results_notify_run_items OWNER TO postgres;

-- ---------------------------------------------------------------------------
-- 2) Backfill ends_at, contrainte dates, NOT NULL
-- ---------------------------------------------------------------------------
UPDATE public.lotteries
SET ends_at = draw_at
WHERE ends_at IS NULL;

ALTER TABLE public.lotteries
  DROP CONSTRAINT IF EXISTS lotteries_dates_are_valid;

ALTER TABLE public.lotteries
  ADD CONSTRAINT lotteries_dates_are_valid CHECK (
    (starts_at IS NULL OR starts_at < ends_at)
    AND (starts_at IS NULL OR starts_at < draw_at)
    AND (ends_at <= draw_at)
  );

ALTER TABLE public.lotteries
  ALTER COLUMN ends_at SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 3) Fermeture batch (à planifier en prod : pg_cron — ex. */5 * * * *)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.close_lotteries_past_ends_at()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH u AS (
    UPDATE public.lotteries l
    SET
      status = 'closed'::public.lottery_status,
      updated_at = now()
    WHERE l.status = 'active'::public.lottery_status
      AND l.ends_at <= now()
    RETURNING l.id
  )
  SELECT count(*)::integer FROM u;
$$;

ALTER FUNCTION public.close_lotteries_past_ends_at() OWNER TO postgres;

COMMENT ON FUNCTION public.close_lotteries_past_ends_at() IS
  'Passe en closed les loteries active dont ends_at <= now(). À appeler périodiquement (ex. pg_cron).';

REVOKE ALL ON FUNCTION public.close_lotteries_past_ends_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_lotteries_past_ends_at() TO service_role;

-- ---------------------------------------------------------------------------
-- 4) Trigger : à chaque écriture sur lotteries, si encore active et fenêtre finie → closed
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lotteries_enforce_close_after_ends_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active'::public.lottery_status AND NEW.ends_at <= now() THEN
    NEW.status := 'closed'::public.lottery_status;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.lotteries_enforce_close_after_ends_at() OWNER TO postgres;

DROP TRIGGER IF EXISTS lotteries_enforce_close_after_ends_at ON public.lotteries;

CREATE TRIGGER lotteries_enforce_close_after_ends_at
  BEFORE INSERT OR UPDATE ON public.lotteries
  FOR EACH ROW
  EXECUTE FUNCTION public.lotteries_enforce_close_after_ends_at();

COMMENT ON TRIGGER lotteries_enforce_close_after_ends_at ON public.lotteries IS
  'Si la loterie est encore active et ends_at <= now(), passage automatique à closed (sans utiliser draw_at pour fermer).';

-- ---------------------------------------------------------------------------
-- 5) Après achat de ticket : tenter de fermer la loterie si la date de fin est passée
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lottery_tickets_after_insert_try_close_lottery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.lotteries l
  SET
    status = 'closed'::public.lottery_status,
    updated_at = now()
  WHERE l.id = NEW.lottery_id
    AND l.status = 'active'::public.lottery_status
    AND l.ends_at <= now();
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.lottery_tickets_after_insert_try_close_lottery() OWNER TO postgres;

DROP TRIGGER IF EXISTS lottery_tickets_after_insert_try_close_lottery ON public.lottery_tickets;

CREATE TRIGGER lottery_tickets_after_insert_try_close_lottery
  AFTER INSERT ON public.lottery_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.lottery_tickets_after_insert_try_close_lottery();

COMMENT ON TRIGGER lottery_tickets_after_insert_try_close_lottery ON public.lottery_tickets IS
  'Ferme la loterie si ends_at est dépassée au moment d’un nouvel achat (complément sans horloge sur la ligne loterie).';
