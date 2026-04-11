-- Profile demographics: civil birth date and biological sex (marketing / stats).
-- Both nullable for existing users; app will enforce required fields for new signups later.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_date date;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sex text;

COMMENT ON COLUMN public.profiles.birth_date IS 'Civil calendar birth date (no time-of-day). Nullable for legacy accounts.';

COMMENT ON COLUMN public.profiles.sex IS 'Closed set: female, male, other, prefer_not_to_say. Nullable for legacy accounts.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.conname = 'profiles_sex_allowed_values_check'
      AND n.nspname = 'public'
      AND t.relname = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_sex_allowed_values_check
      CHECK (
        sex IN (
          'female',
          'male',
          'other',
          'prefer_not_to_say'
        )
      );
  END IF;
END $$;
