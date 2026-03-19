import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";

import i18n from "@/src/i18n";
import {
  getPurchasedTickets,
  type PurchasedTicketRow,
} from "../services/getPurchasedTickets";

import { LotteryStatus } from "../../lotteries/types";

export type PurchasedTicketUi = {
  id: string;
  lottery_id: string;
  purchased_at: string;

  lottery_title: string;
  lottery_status: LotteryStatus | null;
  lottery_status_label: string;
};

function mapLotteryStatusToLabel(
  status: PurchasedTicketUi["lottery_status"],
): string {
  if (!status) return i18n.t("lottery.status.unknown");

  switch (status) {
    case "active":
      return i18n.t("lottery.status.active");
    case "closed":
      return i18n.t("lottery.status.closed");
    case "drawn":
      return i18n.t("lottery.status.drawn");
    default:
      return i18n.t("lottery.status.unknown");
  }
}

function mapRowToUi(row: PurchasedTicketRow): PurchasedTicketUi {
  const lotteryTitle = row.lotteries?.title ?? "";
  const lotteryStatus = row.lotteries?.status ?? null;

  return {
    id: row.id,
    lottery_id: row.lottery_id,
    purchased_at: row.purchased_at,

    lottery_title: lotteryTitle,
    lottery_status: lotteryStatus,
    lottery_status_label: mapLotteryStatusToLabel(lotteryStatus),
  };
}

export function usePurchasedTicketsQuery() {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["wallet", "tickets", userId],
    queryFn: () => getPurchasedTickets(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
    select: (rows): PurchasedTicketUi[] => rows.map(mapRowToUi),
  });
}
