-- Avatars storage RLS: match avatar.<ext> case-insensitively (e.g. avatar.JPG).
-- Replaces ~ with ~* for the extension regex on INSERT / UPDATE / DELETE policies.

DROP POLICY IF EXISTS "avatars_authenticated_insert_own_path" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_update_own_path" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_delete_own_path" ON storage.objects;

CREATE POLICY "avatars_authenticated_insert_own_path"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND lower((storage.foldername(name))[1]) = lower((auth.uid())::text)
    AND (
      storage.filename(name) = 'avatar'
      OR storage.filename(name) ~* '^avatar\.(jpg|jpeg|png|webp|heic|heif)$'
    )
  );

CREATE POLICY "avatars_authenticated_update_own_path"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND lower((storage.foldername(name))[1]) = lower((auth.uid())::text)
    AND (
      storage.filename(name) = 'avatar'
      OR storage.filename(name) ~* '^avatar\.(jpg|jpeg|png|webp|heic|heif)$'
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND lower((storage.foldername(name))[1]) = lower((auth.uid())::text)
    AND (
      storage.filename(name) = 'avatar'
      OR storage.filename(name) ~* '^avatar\.(jpg|jpeg|png|webp|heic|heif)$'
    )
  );

CREATE POLICY "avatars_authenticated_delete_own_path"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND lower((storage.foldername(name))[1]) = lower((auth.uid())::text)
    AND (
      storage.filename(name) = 'avatar'
      OR storage.filename(name) ~* '^avatar\.(jpg|jpeg|png|webp|heic|heif)$'
    )
  );
