import type { AvailableLotteryUi } from "../hooks/useAvailableLotteriesQuery";
import { getTimeRemaining } from "./lotteryTime";

export type LotteryCatalogScope =
  | "all"
  | "endingSoon"
  | "featured"
  | "giftCard";

/** Lotteries whose end date falls within this window are "ending soon". */
export const LOTTERY_ENDING_SOON_MS = 7 * 24 * 60 * 60 * 1000;

export function parseLotteryCatalogScope(
  raw: string | string[] | undefined,
): LotteryCatalogScope {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "endingSoon" || v === "featured" || v === "giftCard") return v;
  return "all";
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Featured first, then soonest end date (ongoing / no date last), then stable pseudo-random tie-break.
 */
export function compareLotteriesForCatalog(
  a: AvailableLotteryUi,
  b: AvailableLotteryUi,
): number {
  if (a.is_featured !== b.is_featured) {
    return a.is_featured ? -1 : 1;
  }

  const endA = a.ends_at
    ? new Date(a.ends_at).getTime()
    : Number.POSITIVE_INFINITY;
  const endB = b.ends_at
    ? new Date(b.ends_at).getTime()
    : Number.POSITIVE_INFINITY;
  const safeEndA = Number.isNaN(endA) ? Number.POSITIVE_INFINITY : endA;
  const safeEndB = Number.isNaN(endB) ? Number.POSITIVE_INFINITY : endB;
  if (safeEndA !== safeEndB) {
    return safeEndA - safeEndB;
  }

  return hashId(a.id) - hashId(b.id);
}

export function isLotteryEndingSoonWindow(
  lottery: AvailableLotteryUi,
  nowMs: number,
): boolean {
  if (!lottery.ends_at) return false;
  const remaining = getTimeRemaining(lottery.ends_at, nowMs);
  if ("kind" in remaining && remaining.kind === "expired") return false;
  const end = new Date(lottery.ends_at).getTime();
  return end - nowMs <= LOTTERY_ENDING_SOON_MS;
}

export function filterLotteriesByScope(
  items: AvailableLotteryUi[],
  scope: LotteryCatalogScope,
  nowMs: number,
): AvailableLotteryUi[] {
  switch (scope) {
    case "all":
      return items;
    case "endingSoon":
      return items.filter((l) => isLotteryEndingSoonWindow(l, nowMs));
    case "featured":
      return items.filter((l) => l.is_featured && l.category !== "gift-card");
    case "giftCard":
      return items.filter((l) => l.category === "gift-card");
    default:
      return items;
  }
}

export function filterLotteriesByCategory(
  items: AvailableLotteryUi[],
  category: "all" | string,
): AvailableLotteryUi[] {
  if (category === "all") return items;
  return items.filter(
    (l) => (l.category ?? "").toLowerCase() === category.toLowerCase(),
  );
}

export function filterLotteriesBySearchQuery(
  items: AvailableLotteryUi[],
  query: string,
): AvailableLotteryUi[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return items;
  return items.filter((l) =>
    `${l.title} ${l.brand?.name ?? ""}`.toLowerCase().includes(q),
  );
}
