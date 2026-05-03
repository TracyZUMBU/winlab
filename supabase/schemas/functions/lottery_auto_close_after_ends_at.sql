-- Fermeture automatique active → closed quand ends_at <= now() (sans utiliser draw_at pour fermer).
-- Miroir logique : migration 20260513120000_lottery_ends_at_notify_runs_and_auto_close.sql

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
  'Si la loterie est encore active et ends_at <= now(), passage automatique à closed.';

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
  'Ferme la loterie si ends_at est dépassée au moment d’un nouvel achat.';
