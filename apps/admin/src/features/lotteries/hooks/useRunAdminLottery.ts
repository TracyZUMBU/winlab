import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ServiceFailureError } from "../../../lib/api/serviceFailureError";
import { lotteryAdminKeys } from "../queries/lotteryAdmin.keys";
import { runAdminLottery } from "../services/runAdminLottery";
import type { RunAdminLotteryData } from "../services/runAdminLottery";

export function useRunAdminLottery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lotteryId: string): Promise<RunAdminLotteryData> => {
      const id = lotteryId.trim();
      const result = await runAdminLottery({ lotteryId: id });
      if (!result.success) {
        throw new ServiceFailureError(result.errorCode);
      }
      return result.data;
    },
    onSuccess: async (_data, lotteryId) => {
      const id = lotteryId.trim();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: lotteryAdminKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: lotteryAdminKeys.list() }),
      ]);
    },
  });
}
