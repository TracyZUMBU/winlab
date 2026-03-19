import { useMutation } from "@tanstack/react-query";

import { queryClient } from "@/src/lib/query/queryClient";
import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";

import {
  submitMissionCompletion,
  type SubmitMissionCompletionParams,
  type SubmitMissionCompletionResult,
} from "../services/missionService";

export function useSubmitMissionCompletionMutation() {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: (payload: SubmitMissionCompletionParams) =>
      submitMissionCompletion(payload),

    onSuccess: (
      result: SubmitMissionCompletionResult,
      variables: SubmitMissionCompletionParams,
    ) => {
      if (!result.success) return;

      queryClient.invalidateQueries({ queryKey: ["missions", "available"] });
      queryClient.invalidateQueries({
        queryKey: ["missions", variables.missionId],
      });

      if (!userId) return;

      // Mission completions can affect wallet balance, pending rewards, and transactions.
      queryClient.invalidateQueries({
        queryKey: ["wallet", "balance", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["wallet", "pendingRewards", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["wallet", "transactions", userId],
      });
    },
  });
}
