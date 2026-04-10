import { queryOptions } from "@tanstack/react-query";

import { getLotteries } from "../services/getLotteries";
import { lotteryAdminKeys } from "./lotteryAdmin.keys";

export function adminLotteriesListOptions() {
  return queryOptions({
    queryKey: lotteryAdminKeys.list(),
    queryFn: () => getLotteries(),
  });
}
