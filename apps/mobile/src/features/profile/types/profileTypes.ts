import type { ProfileSex } from "./profileSex";

export type Profile = {
  id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  /** Date civile `YYYY-MM-DD` (colonne Postgres `date`). */
  birth_date: string | null;
  sex: ProfileSex | null;
  created_at: string | null;
  referral_code: string | null;
};

export type CreateProfilePayload = {
  userId: string;
  email: string;
  username: string;
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
};
