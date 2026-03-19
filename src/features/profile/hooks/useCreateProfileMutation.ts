import { useMutation } from "@tanstack/react-query";

import { createProfile } from "../services/createProfile";
import type { CreateProfilePayload } from "../types/profileTypes";

export function useCreateProfileMutation() {
  return useMutation({
    mutationFn: (payload: CreateProfilePayload) => createProfile(payload),
  });
}
