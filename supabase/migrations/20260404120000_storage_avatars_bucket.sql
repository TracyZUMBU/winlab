-- Bucket public pour avatars utilisateur.
-- Convention d’objet : "{auth.uid()}/avatar" (clé relative au bucket, sans préfixe bucket).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMENT ON COLUMN public.profiles.avatar_url IS
  'Path within storage bucket "avatars" (e.g. {user_id}/avatar), not a full HTTP URL.';

DROP POLICY IF EXISTS "avatars_authenticated_insert_own_path" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_update_own_path" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_delete_own_path" ON storage.objects;

-- Un seul objet par utilisateur : nom exact "<uid>/avatar"
CREATE POLICY "avatars_authenticated_insert_own_path"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND name = (auth.uid())::text || '/avatar'
  );

CREATE POLICY "avatars_authenticated_update_own_path"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name = (auth.uid())::text || '/avatar'
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND name = (auth.uid())::text || '/avatar'
  );

CREATE POLICY "avatars_authenticated_delete_own_path"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name = (auth.uid())::text || '/avatar'
  );
