import { useMutation } from "@tanstack/react-query";

import { queryClient } from "@/src/lib/query/queryClient";

import {
  submitMissionCompletion,
  type SubmitMissionCompletionParams,
  type SubmitMissionCompletionResult,
} from "../services/missionService";

export function useSubmitMissionCompletionMutation() {
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
    },
  });
}
