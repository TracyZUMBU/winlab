/**
 * Valeurs autorisées pour `public.profiles.sex` (contrainte CHECK en base).
 * Type applicatif : Postgres utilise `text`, pas un ENUM nommé.
 */
export const ProfileSex = {
  female: "female",
  male: "male",
  other: "other",
  prefer_not_to_say: "prefer_not_to_say",
} as const;

export type ProfileSex = (typeof ProfileSex)[keyof typeof ProfileSex];

const profileSexValues = new Set<string>(Object.values(ProfileSex));

export function isProfileSex(value: string): value is ProfileSex {
  return profileSexValues.has(value);
}
