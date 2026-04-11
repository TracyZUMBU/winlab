-- RLS on public.profiles: end users (role authenticated) only see and change their own row.
-- birth_date, sex, avatar_url are not column-filtered here (Postgres RLS is row-level);
-- they stay private because no other end-user row is visible under these policies.
-- Admin / server: use service_role (bypasses RLS) or another trusted path — no extra SQL in this migration.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "profiles_authenticated_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_authenticated_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_authenticated_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
