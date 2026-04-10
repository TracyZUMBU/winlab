import { queryOptions } from "@tanstack/react-query";

import { ServiceFailureError } from "../../../lib/api/serviceFailureError";
import { getAdminLotteries } from "../services/getAdminLotteries";
import { lotteryAdminKeys } from "./lotteryAdmin.keys";

export function adminLotteriesListOptions() {
  return queryOptions({
    queryKey: lotteryAdminKeys.list(),
    queryFn: async () => {
      const result = await getAdminLotteries();
      if (!result.success) {
        throw new ServiceFailureError(result.errorCode);
      }
      return result.data;
    },
  });
}
