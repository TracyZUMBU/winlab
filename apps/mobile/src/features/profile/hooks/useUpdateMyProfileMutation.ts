import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateMyProfile } from "../services/updateMyProfile";
import type { Profile, UpdateMyProfileInput } from "../types/profileTypes";

export function useUpdateMyProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMyProfileInput) => updateMyProfile(input),
    onSuccess: (data: Profile) => {
      queryClient.invalidateQueries({
        queryKey: ["profile", "me", data.id],
      });
    },
  });
}
