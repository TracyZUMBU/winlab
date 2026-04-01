import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";
import i18n from "@/src/i18n";

import {
  getLotteryById,
  type LotteryDetailRow,
} from "../services/getLotteryById";

import type { LotteryStatus } from "../types";
import { formatEndingSoonTime, getTimeRemaining } from "../utils/lotteryTime";

export type LotteryDetailUi = LotteryDetailRow & {
  statusLabel: string;
  participantsLabel: string;
  ticketCostLabel: string;
  userTicketsLabel: string;
  timeRemainingLabel: string;
};

function mapLotteryStatusToLabel(status: LotteryStatus): string {
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

function mapRowToUi(row: LotteryDetailRow): LotteryDetailUi {
  const remaining = getTimeRemaining(row.ends_at, Date.now());

  return {
    ...row,
    statusLabel: mapLotteryStatusToLabel(row.status),
    participantsLabel: i18n.t("lottery.entries", {
      count: row.active_tickets_count,
    }),
    ticketCostLabel: i18n.t("lottery.tokens", { count: row.ticket_cost }),
    userTicketsLabel: i18n.t("lottery.youHaveTickets", {
      count: row.user_active_tickets_count,
    }),
    timeRemainingLabel: formatEndingSoonTime(i18n.t.bind(i18n), remaining),
  };
}

export function useLotteryDetailQuery(lotteryId: string | undefined) {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["lotteries", "detail", lotteryId, userId],
    queryFn: () => getLotteryById(lotteryId!, userId!),
    enabled: !!lotteryId && !!userId,
    staleTime: 60 * 1000,
    select: (row): LotteryDetailUi => mapRowToUi(row),
  });
}
