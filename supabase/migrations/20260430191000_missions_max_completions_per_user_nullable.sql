ALTER TABLE public.missions
  ALTER COLUMN max_completions_per_user DROP NOT NULL,
  ALTER COLUMN max_completions_per_user DROP DEFAULT;
