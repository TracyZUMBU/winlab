import type { LotteryCreateStatus } from "../types/lotteryAdmin";
import { getDefaultLotteryScheduleLocalParis } from "./lotteryFormParisTime";

export const LOTTERY_CREATE_FORM_DEFAULTS = {
  ticket_cost: "50",
  number_of_winners: "1",
  status: "draft" as LotteryCreateStatus,
  is_featured: false,
} as const;

export type LotteryCreateFormDateFields = {
  starts_at_local: string;
  ends_at_local: string;
  draw_at_local: string;
};

/** Champs date/heure par défaut (Paris, `datetime-local`). */
export function getDefaultLotteryCreateDateFields(
  now: Date = new Date(),
): LotteryCreateFormDateFields {
  const schedule = getDefaultLotteryScheduleLocalParis(now);
  return {
    starts_at_local: schedule.startsAtLocal,
    ends_at_local: schedule.endsAtLocal,
    draw_at_local: schedule.drawAtLocal,
  };
}
