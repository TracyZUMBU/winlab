import type { ProfileSex } from "./profileSex";

export type Profile = {
  id: string;
  email: string | null;
  username: string | null;
  /**
   * Chemin dans le bucket Storage `avatars` (ex. `{user_id}/avatar.jpg` ou legacy `{user_id}/avatar`), pas une URL HTTP.
   * Les anciennes lignes peuvent encore contenir une URL absolue.
   */
  avatar_url: string | null;
  /** Date civile `YYYY-MM-DD` (colonne Postgres `date`). */
  birth_date: string | null;
  sex: ProfileSex | null;
  created_at: string | null;
  /** Pour cache-bust de l’image avatar après remplacement du fichier. */
  updated_at: string | null;
  referral_code: string | null;
};

export type CreateProfilePayload = {
  userId: string;
  email: string;
  username: string;
  /** Date civile `YYYY-MM-DD` pour `profiles.birth_date`. */
  birth_date: string;
  sex: ProfileSex;
};

export type CreateProfileErrorCode = "USERNAME_TAKEN";

export class CreateProfileError extends Error {
  readonly code: CreateProfileErrorCode;

  constructor(code: CreateProfileErrorCode) {
    super(code);
    this.name = "CreateProfileError";
    this.code = code;
  }
}

export type UpdateMyProfileInput = {
  username: string;
  /** Date civile `YYYY-MM-DD` pour `profiles.birth_date`. */
  birth_date: string;
  sex: ProfileSex;
};
