import { useInfiniteQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";
import i18n from "@/src/i18n";

import { lotteryListKeys } from "../queries/lotteryListKeys";
import type { AvailableLotteryRow } from "../services/getAvailableLotteriesPage";
import {
  AVAILABLE_LOTTERIES_PAGE_SIZE,
  getAvailableLotteriesPage,
} from "../services/getAvailableLotteriesPage";

import type { LotteryStatus } from "../types";

export type AvailableLotteryUi = AvailableLotteryRow & {
  statusLabel: string;
  participantsLabel: string;
  ticketCostLabel: string;
  userTicketsLabel: string;
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

function mapRowToUi(row: AvailableLotteryRow): AvailableLotteryUi {
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
  };
}

export function useAvailableLotteriesQuery() {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  return useInfiniteQuery({
    queryKey: lotteryListKeys.available(userId),
    queryFn: ({ pageParam }) =>
      getAvailableLotteriesPage({ pageIndex: pageParam ?? 0 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.lotteries.length === AVAILABLE_LOTTERIES_PAGE_SIZE
        ? allPages.length
        : undefined,
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
    select: (data): AvailableLotteryUi[] =>
      data.pages.flatMap((page) => page.lotteries).map(mapRowToUi),
  });
}
