import { z } from "zod";
import i18n from "@/src/i18n";

export const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, i18n.t("emailScreen.error.required"))
    .email(i18n.t("emailScreen.error.email")),
});

export type EmailFormValues = z.infer<typeof emailSchema>;
