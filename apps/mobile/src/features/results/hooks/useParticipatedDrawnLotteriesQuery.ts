import { useInfiniteQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";
import i18n from "@/src/i18n";

import {
  getParticipatedDrawnLotteriesPage,
  PARTICIPATED_DRAWN_LOTTERIES_PAGE_SIZE,
  type ParticipatedDrawnLotteryBrand,
  type ParticipatedDrawnLotteryRow,
} from "../services/getParticipatedDrawnLotteries";

export type ParticipatedDrawnLotteryUi = {
  id: string;
  title: string;
  image_url: string | null;
  draw_at: string;
  drawAtLabel: string;
  brand: ParticipatedDrawnLotteryBrand;
  userTicketsCount: number;
  userResultStatus: "won" | "lost";
  userResultStatusLabel: string;
  winnerPosition: number | null;
};

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

function mapRowToUi(
  row: ParticipatedDrawnLotteryRow,
): ParticipatedDrawnLotteryUi {
  const won = row.user_winner_position != null;
  return {
    id: row.id,
    title: row.title,
    image_url: row.image_url,
    draw_at: row.draw_at,
    drawAtLabel: formatDrawAtLabel(row.draw_at),
    brand: row.brand,
    userTicketsCount: row.user_active_tickets_count,
    userResultStatus: won ? "won" : "lost",
    userResultStatusLabel: won
      ? i18n.t("results.userStatus.won")
      : i18n.t("results.userStatus.lost"),
    winnerPosition: row.user_winner_position,
  };
}

export function useParticipatedDrawnLotteriesQuery() {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  return useInfiniteQuery({
    queryKey: ["results", "participated", userId],
    queryFn: ({ pageParam }) =>
      getParticipatedDrawnLotteriesPage({
        userId: userId!,
        pageIndex: pageParam ?? 0,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.lotteries.length === PARTICIPATED_DRAWN_LOTTERIES_PAGE_SIZE
        ? allPages.length
        : undefined,
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    select: (data): ParticipatedDrawnLotteryUi[] =>
      data.pages.flatMap((page) => page.lotteries).map(mapRowToUi),
  });
}
