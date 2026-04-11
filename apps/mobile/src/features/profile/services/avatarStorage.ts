import { getSupabaseClient } from "@/src/lib/supabase/client";

/** Bucket Supabase (id = name = `avatars`). */
export const AVATARS_STORAGE_BUCKET = "avatars" as const;

const MIME_TO_AVATAR_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

/**
 * Chemin d’objet dans le bucket : `{userId}/avatar.{ext}` (extension selon le MIME).
 * L’extension permet l’aperçu dans le dashboard Supabase et l’affichage direct dans le navigateur.
 * Valeur à persister dans `profiles.avatar_url`.
 */
export function buildAvatarStorageObjectPath(
  userId: string,
  normalizedMimeType: string,
): string {
  const ext = MIME_TO_AVATAR_EXT[normalizedMimeType] ?? "jpg";
  return `${userId.toLowerCase()}/avatar.${ext}`;
}

const LEGACY_HTTP = /^https?:\/\//i;

/**
 * URL affichable pour `expo-image` : résout une clé storage via le bucket public, ou renvoie une URL absolue legacy.
 * `cacheBust` évite le cache client après remplacement du fichier (ex. `updated_at` ISO).
 */
export function resolveAvatarDisplayUri(
  avatarRef: string | null | undefined,
  cacheBust?: string | null,
): string | null {
  if (!avatarRef?.trim()) {
    return null;
  }
  const ref = avatarRef.trim();
  if (LEGACY_HTTP.test(ref)) {
    return ref;
  }

  const supabase = getSupabaseClient();
  const { data } = supabase.storage
    .from(AVATARS_STORAGE_BUCKET)
    .getPublicUrl(ref);

  let url = data.publicUrl;
  if (cacheBust?.trim()) {
    const sep = url.includes("?") ? "&" : "?";
    url = `${url}${sep}v=${encodeURIComponent(cacheBust.trim())}`;
  }
  return url;
}
