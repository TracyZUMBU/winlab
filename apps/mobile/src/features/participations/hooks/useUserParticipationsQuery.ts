import { useInfiniteQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";
import i18n from "@/src/i18n";

import { userParticipationsInfiniteOptions } from "../queries/userParticipationsQuery";
import type { UserParticipationRow } from "../types/userParticipation";

export type UserParticipationUi = {
  lotteryId: string;
  title: string;
  image_url: string | null;
  draw_at: string;
  drawAtLabel: string;
  status: UserParticipationRow["status"];
  userTicketsCount: number;
  lastParticipatedAt: string;
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

function mapRowToUi(row: UserParticipationRow): UserParticipationUi {
  return {
    lotteryId: row.lottery_id,
    title: row.title,
    image_url: row.image_url,
    draw_at: row.draw_at,
    drawAtLabel: formatDrawAtLabel(row.draw_at),
    status: row.status,
    userTicketsCount: row.user_tickets_count,
    lastParticipatedAt: row.last_participated_at,
  };
}

export function useUserParticipationsQuery() {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  return useInfiniteQuery({
    ...userParticipationsInfiniteOptions(userId),
    select: (data): UserParticipationUi[] =>
      data.pages.flatMap((page) => page.participations).map(mapRowToUi),
  });
}
