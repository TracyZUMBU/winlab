import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";
import i18n from "@/src/i18n";

import {
  getAvailableLotteries,
  type AvailableLotteryRow,
} from "../services/getAvailableLotteries";

import type { LotteryStatus } from "../types";

export type AvailableLotteryUi = AvailableLotteryRow & {
  statusLabel: string;
  participantsLabel: string;
  ticketCostLabel: string;
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
    return i18n.t("lottery.time.zero");
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const remainingMinutesAfterDays = totalMinutes - days * 60 * 24;
  const hours = Math.floor(remainingMinutesAfterDays / 60);
  const minutes = remainingMinutesAfterDays - hours * 60;

  if (days > 0) {
    return i18n.t("lottery.time.daysHours", { days, hours });
  }

  return i18n.t("lottery.time.hoursMinutes", { hours, minutes });
}

function mapRowToUi(row: AvailableLotteryRow): AvailableLotteryUi {
  return {
    ...row,
    statusLabel: mapLotteryStatusToLabel(row.status),
    participantsLabel: i18n.t("lottery.entries", {
      count: row.active_tickets_count,
    }),
    ticketCostLabel: i18n.t("lottery.tokens", { count: row.ticket_cost }),
    timeRemainingLabel: formatTimeRemaining(row.ends_at),
  };
}

export function useAvailableLotteriesQuery() {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["lotteries", "available", userId],
    queryFn: () => getAvailableLotteries(),
    enabled: !!userId,
    staleTime: 60 * 1000,
    select: (rows): AvailableLotteryUi[] => rows.map(mapRowToUi),
  });
}
