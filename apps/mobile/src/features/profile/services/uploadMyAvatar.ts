import { File as ExpoFsFile } from "expo-file-system";
import { Platform } from "react-native";

import { getSupabaseClient } from "@/src/lib/supabase/client";

import type { Profile } from "../types/profileTypes";
import { profileFromRow } from "../types/profileMapper";
import {
  AVATARS_STORAGE_BUCKET,
  buildAvatarStorageObjectPath,
} from "./avatarStorage";
import { PROFILE_MVP_COLUMNS } from "./profileMvpColumns";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function normalizeMimeType(mime: string): string {
  const m = mime.toLowerCase().trim();
  if (m === "image/jpg") return "image/jpeg";
  return m;
}

export function assertAvatarImageMimeType(mimeType: string): void {
  const normalized = normalizeMimeType(mimeType);
  if (!ALLOWED_MIME.has(normalized)) {
    throw new AvatarUploadError("INVALID_IMAGE_TYPE");
  }
}

export type AvatarUploadErrorCode =
  | "INVALID_IMAGE_TYPE"
  | "NOT_AUTHENTICATED"
  | "UPLOAD_FAILED"
  | "PROFILE_UPDATE_FAILED";

export class AvatarUploadError extends Error {
  readonly code: AvatarUploadErrorCode;

  constructor(
    code: AvatarUploadErrorCode,
    options?: { cause?: unknown },
  ) {
    super(code, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "AvatarUploadError";
    this.code = code;
  }
}

/**
 * Chaîne de diagnostic (message + causes en chaîne) pour matcher les erreurs Supabase
 * lorsque l’erreur est enveloppée dans {@link AvatarUploadError}.
 */
export function getUploadErrorDiagnosticText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 8 && current != null; depth++) {
    if (current instanceof Error) {
      parts.push(current.message);
      const next = (current as Error & { cause?: unknown }).cause;
      current = next !== undefined ? next : null;
    } else if (typeof current === "object" && current !== null && "message" in current) {
      const m = (current as { message?: unknown }).message;
      if (typeof m === "string") {
        parts.push(m);
      }
      current = null;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join(" ");
}

/**
 * Lit les octets d’une image locale. Sur iOS/Android, `fetch(fileUri).blob()` renvoie souvent un Blob
 * vide (Hermes / RN) → fichier Storage à 0 octet. `expo-file-system` lit le vrai contenu du fichier.
 */
async function readLocalPickedImageBytes(uri: string): Promise<Uint8Array> {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new AvatarUploadError("UPLOAD_FAILED");
    }
    const buffer = await response.arrayBuffer();
    const out = new Uint8Array(buffer);
    if (out.byteLength === 0) {
      throw new AvatarUploadError("UPLOAD_FAILED");
    }
    return out;
  }

  const file = new ExpoFsFile(uri);
  if (!file.exists) {
    throw new AvatarUploadError("UPLOAD_FAILED");
  }
  const data = await file.bytes();
  if (data.byteLength === 0) {
    throw new AvatarUploadError("UPLOAD_FAILED");
  }
  return data;
}

/**
 * Upload depuis une URI locale (galerie), upsert sur `{userId}/avatar`, puis met à jour `profiles.avatar_url` avec la clé storage.
 */
export async function uploadMyAvatarFromLocalUri(
  localUri: string,
  mimeType: string,
): Promise<Profile> {
  assertAvatarImageMimeType(mimeType);
  const contentType = normalizeMimeType(mimeType);

  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new AvatarUploadError("NOT_AUTHENTICATED", { cause: authError });
  }
  if (!user?.id) {
    throw new AvatarUploadError("NOT_AUTHENTICATED");
  }

  const objectPath = buildAvatarStorageObjectPath(user.id, contentType);

  const imageBytes = await readLocalPickedImageBytes(localUri);

  const { error: storageError } = await supabase.storage
    .from(AVATARS_STORAGE_BUCKET)
    .upload(objectPath, imageBytes, {
      upsert: true,
      contentType,
      cacheControl: "3600",
    });

  if (storageError) {
    throw new AvatarUploadError("UPLOAD_FAILED", { cause: storageError });
  }

  const { data, error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: objectPath })
    .eq("id", user.id)
    .select(PROFILE_MVP_COLUMNS)
    .single();

  if (profileError) {
    throw new AvatarUploadError("PROFILE_UPDATE_FAILED", { cause: profileError });
  }

  return profileFromRow(data);
}
