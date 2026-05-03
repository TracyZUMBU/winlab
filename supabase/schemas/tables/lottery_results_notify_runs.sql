-- Tables d'idempotence pour les notifications « résultats loterie » (option 2).
-- Miroir logique : migration 20260513120000_lottery_ends_at_notify_runs_and_auto_close.sql

CREATE TABLE public.lottery_results_notify_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lottery_results_notify_runs IS
  'Vague de traitement pour les notifications push « résultats loterie » (option 2 idempotence).';

-- Réutilise public.handle_updated_at() (schéma initial) : pas de set_updated_at() dédié dans le dépôt.
CREATE OR REPLACE TRIGGER trg_lottery_results_notify_runs_set_updated_at
  BEFORE UPDATE ON public.lottery_results_notify_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

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
