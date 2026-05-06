-- Miroir logique : migration 20260516120000_missions_rules_text_admin_rls.sql
-- Colonne rules_text + contraintes + politiques RLS admin sur public.missions.

ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS rules_text text;

UPDATE public.missions
SET rules_text = e'## Règlement\n\nLes conditions seront affichées ici.'
WHERE rules_text IS NULL;

ALTER TABLE public.missions
  ALTER COLUMN rules_text SET NOT NULL;

ALTER TABLE public.missions
  ADD CONSTRAINT missions_rules_text_trim_non_empty
  CHECK (char_length(btrim(rules_text, E' \t\n\r')) > 0);

ALTER TABLE public.missions
  ADD CONSTRAINT missions_rules_text_max_length
  CHECK (char_length(rules_text) <= 32000);

COMMENT ON COLUMN public.missions.rules_text IS
  'Règlement de la mission (Markdown, FR). Obligatoire ; affiché dans l''app sur le détail mission.';

CREATE POLICY "Admins can select all missions"
  ON public.missions
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert missions"
  ON public.missions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update missions"
  ON public.missions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
