import { z } from "zod";
import { OTP_CODE_LENGTH } from "../constants/authConstants";
import i18n from "@/src/i18n";

export const otpSchema = z.object({
  code: z
    .string()
    .trim()
    .min(
      OTP_CODE_LENGTH,
      i18n.t("schema.otp.error.min", { length: OTP_CODE_LENGTH }),
    )
    .max(
      OTP_CODE_LENGTH,
      i18n.t("schema.otp.error.max", { length: OTP_CODE_LENGTH }),
    ),
  email: z.email(),
});

export type OtpFormValues = z.infer<typeof otpSchema>;
