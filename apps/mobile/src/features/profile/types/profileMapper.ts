import type { Database } from "@/src/lib/supabase.types";

import { isProfileSex } from "./profileSex";
import type { Profile } from "./profileTypes";

/** Colonnes nécessaires pour reconstruire un `Profile` (aligné sur `PROFILE_MVP_COLUMNS` + insert complet). */
export type ProfileRowFields = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "email"
  | "username"
  | "avatar_url"
  | "birth_date"
  | "sex"
  | "created_at"
  | "referral_code"
>;

/**
 * Mappe une ligne `profiles` (types Supabase) vers le modèle applicatif `Profile`.
 * `sex` est restreint à `ProfileSex` ; toute valeur inattendue devient `null` (défensif).
 */
export function profileFromRow(row: ProfileRowFields): Profile {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    avatar_url: row.avatar_url,
    created_at: row.created_at,
    referral_code: row.referral_code,
    birth_date: row.birth_date,
    sex: row.sex !== null && isProfileSex(row.sex) ? row.sex : null,
  };
}
