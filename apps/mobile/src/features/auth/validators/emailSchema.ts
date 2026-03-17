import { z } from "zod";

export const emailSchema = z.object({
  email: z.email(),
});

export type EmailFormValues = z.infer<typeof emailSchema>;
