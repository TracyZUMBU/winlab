import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteMyAccount } from "../services/deleteMyAccount";

export function useDeleteMyAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteMyAccount(),
    onSuccess: () => {
      // After deletion we generally sign out and leave the authenticated app.
      // Clearing cache avoids showing stale data if the user navigates back quickly.
      queryClient.clear();
    },
  });
}

