/**
 * Valeurs autorisées pour `public.profiles.sex` (contrainte CHECK en base).
 * Type applicatif : Postgres utilise `text`, pas un ENUM nommé.
 */
export const PROFILE_SEX = {
  female: "female",
  male: "male",
  other: "other",
  prefer_not_to_say: "prefer_not_to_say",
} as const;

export type ProfileSex = (typeof PROFILE_SEX)[keyof typeof PROFILE_SEX];

const profileSexValues = new Set<string>(Object.values(PROFILE_SEX));

export function isProfileSex(value: string): value is ProfileSex {
  return profileSexValues.has(value);
}
