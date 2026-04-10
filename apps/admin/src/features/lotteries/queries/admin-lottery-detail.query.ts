import { queryOptions } from "@tanstack/react-query";

import { ServiceFailureError } from "../../../lib/api/serviceFailureError";
import { getAdminLotteryDetail } from "../services/getAdminLotteryDetail";
import { lotteryAdminKeys } from "./lotteryAdmin.keys";

export function adminLotteryDetailOptions(lotteryId: string) {
  const id = lotteryId.trim();
  return queryOptions({
    queryKey: lotteryAdminKeys.detail(id),
    queryFn: async () => {
      const result = await getAdminLotteryDetail(id);
      if (!result.success) {
        throw new ServiceFailureError(result.errorCode);
      }
      return result.data;
    },
    enabled: id.length > 0,
  });
}
