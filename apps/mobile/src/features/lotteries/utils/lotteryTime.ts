import type { TFunction } from "i18next";

export type TimeRemaining =
  | {
      days: number;
      hours: number;
      minutes: number;
    }
  | { kind: "ongoing" }
  | { kind: "expired" };

function isTimeParts(
  remaining: TimeRemaining,
): remaining is { days: number; hours: number; minutes: number } {
  return (
    typeof (remaining as any).days === "number" &&
    typeof (remaining as any).hours === "number" &&
    typeof (remaining as any).minutes === "number"
  );
}

function clampNonNegativeInt(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function getTimeRemaining(
  endsAt: string | null,
  nowMs: number,
): TimeRemaining {
  if (!endsAt) return { kind: "ongoing" };

  const target = new Date(endsAt).getTime();
  const diffMs = target - nowMs;

  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return { kind: "expired" };
  }

  const totalMinutes = clampNonNegativeInt(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const remainingMinutesAfterDays = totalMinutes - days * 60 * 24;
  const hours = Math.floor(remainingMinutesAfterDays / 60);
  const minutes = remainingMinutesAfterDays - hours * 60;

  return { days, hours, minutes };
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** True if the lottery ends in the future in strictly less than 24 hours. */
export function lotteryEndsWithinOneDay(
  endsAt: string | null,
  nowMs: number,
): boolean {
  if (!endsAt) return false;
  const end = new Date(endsAt).getTime();
  const msLeft = end - nowMs;
  return msLeft > 0 && msLeft < ONE_DAY_MS;
}

/**
 * Ending soon badge format (maquette): "3d 5h" or "2h 12m".
 * Reuses existing `lottery.time.*` keys.
 */
export function formatEndingSoonTime(
  t: TFunction,
  remaining: TimeRemaining,
): string {
  if (!isTimeParts(remaining)) {
    return remaining.kind === "ongoing"
      ? t("lottery.time.ongoing")
      : t("lottery.time.zero");
  }

  if (remaining.days > 0) {
    return t("lottery.time.daysHours", {
      days: remaining.days,
      hours: remaining.hours,
    });
  }

  return t("lottery.time.hoursMinutes", {
    hours: remaining.hours,
    minutes: remaining.minutes,
  });
}

/**
 * Featured chip format (maquette): "in X day(s)".
 * We purposely hide hours when days > 0.
 */
export function formatFeaturedTime(
  t: TFunction,
  remaining: TimeRemaining,
): string {
  if (!isTimeParts(remaining)) {
    return remaining.kind === "ongoing"
      ? t("lottery.time.ongoing")
      : t("lotteries.time.inZero");
  }

  if (remaining.days > 0) {
    return t("lotteries.time.inDays", { count: remaining.days });
  }

  return t("lotteries.time.inHoursMinutes", {
    hours: remaining.hours,
    minutes: remaining.minutes,
  });
}

/**
 * Gift card subtitle format (maquette): "Tomorrow" / "3 days" (no "in").
 */
export function formatGiftCardTime(
  t: TFunction,
  remaining: TimeRemaining,
): string {
  if (!isTimeParts(remaining)) {
    return remaining.kind === "ongoing"
      ? t("lottery.time.ongoing")
      : t("lottery.time.zero");
  }

  if (remaining.days === 1) {
    return t("lotteries.time.tomorrow");
  }

  if (remaining.days > 0) {
    return t("lotteries.time.days", { count: remaining.days });
  }

  return t("lotteries.time.hoursMinutes", {
    hours: remaining.hours,
    minutes: remaining.minutes,
  });
}

export type CountdownParts =
  | { kind: "ongoing" }
  | { kind: "expired" }
  | {
      kind: "remaining";
      days: number;
      hours: number;
      minutes: number;
      seconds: number;
    };

function clampNonNegativeIntFromSeconds(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function getCountdownParts(
  endsAt: string | null,
  nowMs: number,
): CountdownParts {
  if (!endsAt) return { kind: "ongoing" };

  const target = new Date(endsAt).getTime();
  const diffMs = target - nowMs;

  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return { kind: "expired" };
  }

  const totalSeconds = clampNonNegativeIntFromSeconds(diffMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const remainingAfterDays = totalSeconds - days * 86400;

  const hours = Math.floor(remainingAfterDays / 3600);
  const remainingAfterHours = remainingAfterDays - hours * 3600;

  const minutes = Math.floor(remainingAfterHours / 60);
  const seconds = remainingAfterHours - minutes * 60;

  return { kind: "remaining", days, hours, minutes, seconds };
}

