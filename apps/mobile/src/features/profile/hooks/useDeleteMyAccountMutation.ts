import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  deleteMyAccount,
  type DeleteMyAccountResult,
} from "../services/deleteMyAccount";

export function useDeleteMyAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (): Promise<DeleteMyAccountResult> => deleteMyAccount(),
    onSuccess: (result) => {
      if (!result.ok) return;
      // After deletion we generally sign out and leave the authenticated app.
      // Clearing cache avoids showing stale data if the user navigates back quickly.
      queryClient.clear();
    },
  });
}

