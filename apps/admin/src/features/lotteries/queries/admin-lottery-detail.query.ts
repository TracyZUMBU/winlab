import { queryOptions } from "@tanstack/react-query";

import { getLotteryAdminDetail } from "../services/getLotteryAdminDetail";
import { lotteryAdminKeys } from "./lotteryAdmin.keys";

export function adminLotteryDetailOptions(lotteryId: string) {
  const id = lotteryId.trim();
  return queryOptions({
    queryKey: lotteryAdminKeys.detail(id),
    queryFn: () => getLotteryAdminDetail(id),
    enabled: id.length > 0,
  });
}
