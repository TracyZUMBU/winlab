-- New enum values must be committed before use (55P04). This migration only
-- extends `mission_type`; seed INSERTs live in `supabase/sql_requetes/` if needed.
ALTER TYPE public.mission_type
ADD VALUE IF NOT EXISTS 'external_action';
