import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";
import i18n from "@/src/i18n";

import {
  getLotteryResultById,
  type LotteryResultBrand,
  type LotteryResultDetailRow,
} from "../services/getLotteryResultById";

export type LotteryResultWinnerUi = {
  position: number;
  maskedUsername: string;
};

export type LotteryResultDetailUi = {
  lottery: {
    id: string;
    title: string;
    image_url: string | null;
    draw_at: string;
    drawAtLabel: string;
    brand: LotteryResultBrand;
  };
  userTicketsCount: number;
  userResultStatus: "won" | "lost";
  userResultStatusLabel: string;
  winnerPosition: number | null;
  ticketsLabel: string;
  winners: LotteryResultWinnerUi[];
};

function maskUsername(username: string): string {
  const trimmed = username.trim();
  if (trimmed.length === 0) {
    return "***";
  }
  const visibleLength = Math.min(3, trimmed.length);
  return `${trimmed.slice(0, visibleLength)}***`;
}

function formatDrawAtLabel(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) {
    return i18n.t("date.unknown");
  }
  return new Intl.DateTimeFormat(i18n.language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function mapDetailToUi(row: LotteryResultDetailRow): LotteryResultDetailUi {
  const won = row.user_winner_position != null;
  return {
    lottery: {
      id: row.lottery.id,
      title: row.lottery.title,
      image_url: row.lottery.image_url,
      draw_at: row.lottery.draw_at,
      drawAtLabel: formatDrawAtLabel(row.lottery.draw_at),
      brand: row.lottery.brand,
    },
    userTicketsCount: row.user_active_tickets_count,
    userResultStatus: won ? "won" : "lost",
    userResultStatusLabel: won
      ? i18n.t("results.userStatus.won")
      : i18n.t("results.userStatus.lost"),
    winnerPosition: row.user_winner_position,
    ticketsLabel: i18n.t("lottery.youHaveTickets", {
      count: row.user_active_tickets_count,
    }),
    winners: row.winners.map((w) => ({
      position: w.position,
      maskedUsername: maskUsername(w.username),
    })),
  };
}

export function useLotteryResultDetailQuery(lotteryId: string | undefined) {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["results", "detail", lotteryId, userId, i18n.language],
    queryFn: () => getLotteryResultById(lotteryId!, userId!),
    enabled: Boolean(lotteryId && userId),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    select: (data): LotteryResultDetailUi | null =>
      data ? mapDetailToUi(data) : null,
  });
}
