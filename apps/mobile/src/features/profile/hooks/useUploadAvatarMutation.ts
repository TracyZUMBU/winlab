import { useMutation, useQueryClient } from "@tanstack/react-query";

import { uploadMyAvatarFromLocalUri } from "../services/uploadMyAvatar";
import type { Profile } from "../types/profileTypes";

export type UploadAvatarMutationInput = {
  localUri: string;
  mimeType: string;
};

export function useUploadAvatarMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ localUri, mimeType }: UploadAvatarMutationInput) =>
      uploadMyAvatarFromLocalUri(localUri, mimeType),
    onSuccess: (data: Profile) => {
      // Mise à jour immédiate du cache (même clé que useMyProfileQuery) pour refléter
      // `updated_at` et le paramètre de cache-bust de l’URL avatar sans attendre le refetch.
      queryClient.setQueryData(["profile", "me", data.id], data);
      void queryClient.invalidateQueries({
        queryKey: ["profile", "me", data.id],
      });
    },
  });
}
