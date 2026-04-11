import { usernameSchema } from "@/src/features/auth/validators/usernameSchema";
import i18n from "@/src/i18n";
import { format, isValid, parse, startOfDay } from "date-fns";
import { z } from "zod";

import { ProfileSex } from "../types/profileSex";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const profileSexZodEnum = z.enum([
  ProfileSex.female,
  ProfileSex.male,
  ProfileSex.other,
  ProfileSex.prefer_not_to_say,
]);

const createProfileFormBaseSchema = usernameSchema.extend({
  birth_date: z
    .string()
    .trim()
    .min(1, i18n.t("schema.createProfile.birthDate.required"))
    .regex(ISO_DATE_RE, i18n.t("schema.createProfile.birthDate.format"))
    .superRefine((val, ctx) => {
      const parsed = parse(val, "yyyy-MM-dd", new Date());
      if (!isValid(parsed) || format(parsed, "yyyy-MM-dd") !== val) {
        ctx.addIssue({
          code: "custom",
          message: i18n.t("schema.createProfile.birthDate.invalid"),
        });
        return;
      }
      const today = startOfDay(new Date());
      if (parsed > today) {
        ctx.addIssue({
          code: "custom",
          message: i18n.t("schema.createProfile.birthDate.future"),
        });
      }
    }),
  /** Optionnel côté défaut RHF ; obligatoire après validation (voir `refine`). */
  sex: profileSexZodEnum.optional(),
});

export const createProfileFormSchema = createProfileFormBaseSchema.refine(
  (data) => data.sex !== undefined,
  {
    path: ["sex"],
    message: i18n.t("schema.createProfile.sex.required"),
  },
);

/** Valeurs du formulaire (avant / après validation). */
export type CreateProfileFormValues = z.infer<typeof createProfileFormBaseSchema>;

/** Ordre d’affichage des options sexe (inscription). */
export const CREATE_PROFILE_SEX_FIELD_ORDER: readonly ProfileSex[] = [
  ProfileSex.female,
  ProfileSex.male,
  ProfileSex.other,
  ProfileSex.prefer_not_to_say,
] as const;
