import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ServiceFailureError } from "../../../lib/api/serviceFailureError";
import { lotteryAdminKeys } from "../queries/lotteryAdmin.keys";
import { createAdminLottery } from "../services/createAdminLottery";
import type {
  CreateAdminLotteryInput,
  CreatedAdminLottery,
} from "../types/lotteryAdmin";

export function useCreateAdminLotteryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: CreateAdminLotteryInput,
    ): Promise<CreatedAdminLottery> => {
      const result = await createAdminLottery(input);
      if (!result.success) {
        throw new ServiceFailureError(result.errorCode);
      }
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: lotteryAdminKeys.lists(),
      });
    },
  });
}
