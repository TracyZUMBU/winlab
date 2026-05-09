import { usernameSchema } from "@/src/features/auth/validators/usernameSchema";
import i18n from "@/src/i18n";
import { format, isValid, parse, startOfDay } from "date-fns";
import { z } from "zod";

import { isFrenchDepartmentCode } from "../constants/frenchDepartments";
import { PROFILE_SEX, type ProfileSex } from "../types/profileSex";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Same alphabet as DB-generated referral_code (no I, O, 0, 1). */
const REFERRAL_CODE_CHARS_RE = /^[A-HJ-NP-Z2-9]{8}$/;

const profileSexZodEnum = z.enum([
  PROFILE_SEX.female,
  PROFILE_SEX.male,
  PROFILE_SEX.other,
  PROFILE_SEX.prefer_not_to_say,
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
  /** Code département FR (hors DOM-TOM). Optionnel côté défaut RHF ; obligatoire après validation (voir `refine`). */
  department_code: z
    .string()
    .transform((s) => s.trim().toUpperCase())
    .optional(),
  referral_code: z
    .string()
    .transform((s) => s.trim().toUpperCase())
    .pipe(
      z.union([
        z.literal(""),
        z
          .string()
          .length(8, i18n.t("schema.createProfile.referralCode.length"))
          .regex(
            REFERRAL_CODE_CHARS_RE,
            i18n.t("schema.createProfile.referralCode.invalid"),
          ),
      ]),
    ),
});

export const createProfileFormSchema = createProfileFormBaseSchema
  .refine((data) => data.sex !== undefined, {
    path: ["sex"],
    message: i18n.t("schema.createProfile.sex.required"),
  })
  .refine((data) => Boolean(data.department_code?.trim()), {
    path: ["department_code"],
    message: i18n.t("schema.createProfile.department.required"),
  })
  .refine(
    (data) =>
      !data.department_code?.trim() ||
      isFrenchDepartmentCode(data.department_code),
    {
      path: ["department_code"],
      message: i18n.t("schema.createProfile.department.invalid"),
    },
  );

/** Valeurs du formulaire (avant / après validation). */
export type CreateProfileFormValues = z.infer<
  typeof createProfileFormBaseSchema
>;

/** Ordre d’affichage des options sexe (inscription). */
export const CREATE_PROFILE_SEX_FIELD_ORDER: readonly ProfileSex[] = [
  PROFILE_SEX.female,
  PROFILE_SEX.male,
  PROFILE_SEX.other,
  PROFILE_SEX.prefer_not_to_say,
] as const;
