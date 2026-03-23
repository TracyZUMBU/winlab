import { useMutation, useQueryClient } from "@tanstack/react-query";

import { signOut } from "../services/signOut";

export function useSignOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => signOut(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
