import type { TFunction } from "i18next";

import {
  getTimeRemaining,
  isTimeParts,
} from "@/src/features/lotteries/utils/lotteryTime";

/**
 * Countdown label for home carousel (padded segments, e.g. 02j 14h 22m in FR).
 */
export function formatHomeLotteryCountdown(
  t: TFunction,
  endsAt: string | null,
  nowMs: number,
): string {
  const remaining = getTimeRemaining(endsAt, nowMs);
  if (!isTimeParts(remaining)) {
    return remaining.kind === "ongoing"
      ? t("lottery.time.ongoing")
      : t("lottery.time.zero");
  }
  const days = String(remaining.days).padStart(2, "0");
  const hours = String(remaining.hours).padStart(2, "0");
  const minutes = String(remaining.minutes).padStart(2, "0");
  return t("home.lottery.countdownPadded", { days, hours, minutes });
}
