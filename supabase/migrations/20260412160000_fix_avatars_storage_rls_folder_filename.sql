-- Align avatars storage RLS with Supabase helpers: object key is "{uid}/avatar"
-- (folder = user id, filename = "avatar"). Comparing full `name` to uid||'/avatar'
-- can fail depending on UUID text casing; use foldername + filename + lower() on uid.
-- See: https://supabase.com/docs/guides/storage/schema/helper-functions

DROP POLICY IF EXISTS "avatars_authenticated_insert_own_path" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_update_own_path" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_delete_own_path" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;

CREATE POLICY "avatars_authenticated_insert_own_path"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND lower((storage.foldername(name))[1]) = lower((auth.uid())::text)
    AND storage.filename(name) = 'avatar'
  );

CREATE POLICY "avatars_authenticated_update_own_path"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND lower((storage.foldername(name))[1]) = lower((auth.uid())::text)
    AND storage.filename(name) = 'avatar'
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND lower((storage.foldername(name))[1]) = lower((auth.uid())::text)
    AND storage.filename(name) = 'avatar'
  );

CREATE POLICY "avatars_authenticated_delete_own_path"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND lower((storage.foldername(name))[1]) = lower((auth.uid())::text)
    AND storage.filename(name) = 'avatar'
  );

-- Bucket is public: allow unauthenticated reads for public URLs / getPublicUrl.
CREATE POLICY "avatars_public_select"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
