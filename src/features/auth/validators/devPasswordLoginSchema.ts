import { z } from "zod";
import i18n from "@/src/i18n";

/** Validates password for the __DEV__ email+password shortcut (email checked separately). */
export const devPasswordLoginSchema = z.object({
  password: z
    .string()
    .min(1, i18n.t("emailScreen.dev.error.passwordRequired")),
});

export type DevPasswordLoginValues = z.infer<typeof devPasswordLoginSchema>;
