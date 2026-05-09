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
  lottery_draw_at: string | null;
};

function formatDrawDateLabel(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) {
    return i18n.t("date.unknown");
  }

  const locale = i18n.language.startsWith("fr") ? "fr-FR" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
  }).format(d);
}

function mapLotteryStatusToLabel(
  status: PurchasedTicketUi["lottery_status"],
  drawAtIso: PurchasedTicketUi["lottery_draw_at"],
): string {
  if (!status) return i18n.t("lottery.status.unknown");

  switch (status) {
    case "active":
      if (drawAtIso) {
        return i18n.t("wallet.ticketSubtitle.drawOn", {
          date: formatDrawDateLabel(drawAtIso),
        });
      }
      return i18n.t("lottery.status.active");
    case "closed":
      return i18n.t("lottery.status.closed");
    case "drawn":
      return i18n.t("wallet.ticketSubtitle.drawCompleted");
    default:
      return i18n.t("lottery.status.unknown");
  }
}

function mapRowToUi(row: PurchasedTicketRow): PurchasedTicketUi {
  const lotteryTitle = row.lotteries?.title ?? "";
  const lotteryStatus = row.lotteries?.status ?? null;
  const lotteryDrawAt = row.lotteries?.draw_at ?? null;

  return {
    id: row.id,
    lottery_id: row.lottery_id,
    purchased_at: row.purchased_at,

    lottery_title: lotteryTitle,
    lottery_status: lotteryStatus,
    lottery_status_label: mapLotteryStatusToLabel(lotteryStatus, lotteryDrawAt),
    lottery_draw_at: lotteryDrawAt,
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
