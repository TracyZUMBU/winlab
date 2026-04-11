/**
 * Édition profil (pseudo, date de naissance, sexe) : mêmes règles que l’inscription.
 */
export {
  createProfileFormSchema as editProfileFormSchema,
  CREATE_PROFILE_SEX_FIELD_ORDER as editProfileSexFieldOrder,
} from "./createProfileFormSchema";
export type { CreateProfileFormValues as EditProfileFormValues } from "./createProfileFormSchema";
