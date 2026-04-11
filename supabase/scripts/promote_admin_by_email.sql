-- Run in Supabase SQL editor (postgres) or any session with privilege to update profiles.is_admin.
-- Replace the email before executing.

UPDATE public.profiles
SET is_admin = true
WHERE lower(trim(email)) = lower(trim('ton-email@example.com'));
