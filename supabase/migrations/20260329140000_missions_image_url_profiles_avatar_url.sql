-- Mission card / detail image (public URL, e.g. Supabase Storage).
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN public.missions.image_url IS 'Optional public URL for mission illustration (storage or CDN).';

-- Profile photo (public URL, e.g. Supabase Storage avatars bucket).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

COMMENT ON COLUMN public.profiles.avatar_url IS 'Optional public URL for the user profile photo.';
