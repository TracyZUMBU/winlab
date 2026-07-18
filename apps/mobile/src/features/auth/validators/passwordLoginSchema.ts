import { z } from "zod";
import i18n from "@/src/i18n";

/** Validates password for whitelist email+password login (email checked separately). */
export const passwordLoginSchema = z.object({
  password: z
    .string()
    .min(1, i18n.t("emailScreen.passwordLogin.error.passwordRequired")),
});

export type PasswordLoginValues = z.infer<typeof passwordLoginSchema>;
