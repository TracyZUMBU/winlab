import { z } from "zod";
import i18n from "@/src/i18n";

export const usernameSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, i18n.t("schema.username.error.min"))
    .max(24, i18n.t("schema.username.error.max")),
});

export type UsernameFormValues = z.infer<typeof usernameSchema>;
