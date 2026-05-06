import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ServiceFailureError } from "../../../lib/api/serviceFailureError";
import { missionAdminKeys } from "../queries/missionAdmin.keys";
import { createAdminMission } from "../services/createAdminMission";
import type {
  CreateAdminMissionInput,
  CreatedAdminMission,
} from "../types/missionAdmin";

export function useCreateAdminMissionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: CreateAdminMissionInput,
    ): Promise<CreatedAdminMission> => {
      const result = await createAdminMission(input);
      if (!result.success) {
        throw new ServiceFailureError(result.errorCode);
      }
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: missionAdminKeys.lists(),
      });
    },
  });
}
