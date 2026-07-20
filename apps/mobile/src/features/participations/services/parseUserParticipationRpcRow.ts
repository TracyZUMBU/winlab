import type { Enums } from "@/src/lib/supabase.types";

import type { UserParticipationRow } from "../types/userParticipation";

const LOTTERY_STATUSES: ReadonlySet<Enums<"lottery_status">> = new Set([
  "draft",
  "active",
  "closed",
  "drawn",
  "cancelled",
]);

function isLotteryStatus(value: unknown): value is Enums<"lottery_status"> {
  return (
    typeof value === "string" &&
    LOTTERY_STATUSES.has(value as Enums<"lottery_status">)
  );
}

export function parseUserParticipationRpcRow(
  value: unknown,
): UserParticipationRow | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;

  if (
    typeof row.lottery_id !== "string" ||
    typeof row.title !== "string" ||
    typeof row.draw_at !== "string" ||
    !isLotteryStatus(row.status) ||
    typeof row.last_participated_at !== "string"
  ) {
    return null;
  }

  const rawCount = row.user_tickets_count;
  const userTicketsCount =
    typeof rawCount === "number"
      ? rawCount
      : typeof rawCount === "string" && rawCount.trim() !== ""
        ? Number(rawCount)
        : NaN;

  if (!Number.isSafeInteger(userTicketsCount) || userTicketsCount < 0) {
    return null;
  }

  return {
    lottery_id: row.lottery_id,
    title: row.title,
    image_url: typeof row.image_url === "string" ? row.image_url : null,
    draw_at: row.draw_at,
    status: row.status,
    user_tickets_count: userTicketsCount,
    last_participated_at: row.last_participated_at,
  };
}
