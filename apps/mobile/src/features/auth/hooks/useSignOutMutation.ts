import { useMutation, useQueryClient } from "@tanstack/react-query";

import { clearDailyLoginLocalCache } from "@/src/features/missions/services/clearDailyLoginLocalCache";
import {
  clearPendingDailyLoginUiOverride,
  invalidateAppBootstrapCache,
} from "@/src/lib/bootstrap/sharedAppBootstrap";

import { signOut } from "../services/signOut";

async function clearAppAuthCaches(): Promise<void> {
  clearPendingDailyLoginUiOverride();
  invalidateAppBootstrapCache();
  await clearDailyLoginLocalCache();
}

export function useSignOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => signOut(),
    onSuccess: async () => {
      await clearAppAuthCaches();
      queryClient.clear();
    },
    onError: async () => {
      await clearAppAuthCaches();
      queryClient.clear();
    },
  });
}
