import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";
import i18n from "@/src/i18n";

import {
  getLotteryById,
  type LotteryDetailRow,
} from "../services/getLotteryById";

import type { LotteryStatus } from "../types";

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

function formatTimeRemaining(endsAt: string | null): string {
  if (!endsAt) {
    return i18n.t("lottery.time.ongoing");
  }

  const target = new Date(endsAt).getTime();
  const now = Date.now();
  const diffMs = target - now;

  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return "0h 0m";
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const remainingMinutesAfterDays = totalMinutes - days * 60 * 24;
  const hours = Math.floor(remainingMinutesAfterDays / 60);
  const minutes = remainingMinutesAfterDays - hours * 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function mapRowToUi(row: LotteryDetailRow): LotteryDetailUi {
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
    timeRemainingLabel: formatTimeRemaining(row.ends_at),
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
