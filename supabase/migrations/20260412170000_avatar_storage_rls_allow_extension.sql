-- Autoriser les objets `.../avatar` (legacy, sans extension) et `.../avatar.<ext>` (jpg, png, webp, heic, heif).
-- L’extension améliore l’aperçu dashboard et le rendu navigateur pour les URLs publiques.

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
      OR storage.filename(name) ~ '^avatar\.(jpg|jpeg|png|webp|heic|heif)$'
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
      OR storage.filename(name) ~ '^avatar\.(jpg|jpeg|png|webp|heic|heif)$'
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND lower((storage.foldername(name))[1]) = lower((auth.uid())::text)
    AND (
      storage.filename(name) = 'avatar'
      OR storage.filename(name) ~ '^avatar\.(jpg|jpeg|png|webp|heic|heif)$'
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
      OR storage.filename(name) ~ '^avatar\.(jpg|jpeg|png|webp|heic|heif)$'
    )
  );
