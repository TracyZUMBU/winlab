-- Alignement schéma : supabase/schemas/tables/lottery_results_notify_runs.sql
-- Colonne updated_at + trigger (réutilise public.handle_updated_at).

ALTER TABLE public.lottery_results_notify_runs
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE TRIGGER trg_lottery_results_notify_runs_set_updated_at
  BEFORE UPDATE ON public.lottery_results_notify_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
