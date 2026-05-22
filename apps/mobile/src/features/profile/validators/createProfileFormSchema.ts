import { usernameSchema } from "@/src/features/auth/validators/usernameSchema";
import i18n from "@/src/i18n";
import { format, isValid, parse, startOfDay } from "date-fns";
import { z } from "zod";

import { isFrenchDepartmentCode } from "../constants/frenchDepartments";
import {
  RESIDENCE_COUNTRY_CODES,
  requiresFrenchDepartment,
} from "../constants/residenceCountries";
import { parseResidenceCountryFromForm } from "../utils/normalizeProfileLocation";
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

/** Champs profil partagés (création + édition), sans code parrain. */
export const profileFormCoreSchema = usernameSchema.extend({
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
  /** Optionnel côté défaut RHF ; obligatoire après validation si pays = FR. */
  residence_country: z
    .string()
    .transform((s) => s.trim().toUpperCase())
    .optional(),
  department_code: z
    .string()
    .transform((s) => s.trim().toUpperCase())
    .optional(),
});

const createProfileFormBaseSchema = profileFormCoreSchema.extend({
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

function refineProfileLocation(
  data: z.infer<typeof profileFormCoreSchema>,
  ctx: z.RefinementCtx,
): void {
  const country = parseResidenceCountryFromForm(data.residence_country);
  if (!country) {
    ctx.addIssue({
      code: "custom",
      path: ["residence_country"],
      message: i18n.t("schema.createProfile.residenceCountry.required"),
    });
    return;
  }

  if (!RESIDENCE_COUNTRY_CODES.includes(country)) {
    ctx.addIssue({
      code: "custom",
      path: ["residence_country"],
      message: i18n.t("schema.createProfile.residenceCountry.invalid"),
    });
    return;
  }

  if (requiresFrenchDepartment(country)) {
    if (!data.department_code?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["department_code"],
        message: i18n.t("schema.createProfile.department.required"),
      });
      return;
    }
    if (!isFrenchDepartmentCode(data.department_code)) {
      ctx.addIssue({
        code: "custom",
        path: ["department_code"],
        message: i18n.t("schema.createProfile.department.invalid"),
      });
    }
    return;
  }

  if (data.department_code?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["department_code"],
      message: i18n.t("schema.createProfile.department.notAllowed"),
    });
  }
}

function applyProfileFieldRefinements(
  data: z.infer<typeof profileFormCoreSchema>,
  ctx: z.RefinementCtx,
): void {
  if (data.sex === undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["sex"],
      message: i18n.t("schema.createProfile.sex.required"),
    });
  }
  refineProfileLocation(data, ctx);
}

export const editProfileFormSchema =
  profileFormCoreSchema.superRefine(applyProfileFieldRefinements);

export type EditProfileFormValues = z.infer<typeof profileFormCoreSchema>;

export const createProfileFormSchema =
  createProfileFormBaseSchema.superRefine(applyProfileFieldRefinements);

/** Valeurs du formulaire inscription (avant / après validation). */
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
