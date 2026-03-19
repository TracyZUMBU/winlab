import {
  differenceInCalendarDays,
  format,
  isValid,
  startOfDay,
} from "date-fns";
import { fr } from "date-fns/locale";

export type RelativeDayBucket =
  | { kind: "today" }
  | { kind: "yesterday" }
  | { kind: "daysAgo"; days: number }
  | { kind: "unknown" };

export function getRelativeDayBucket(
  iso: string,
  now: Date = new Date(),
): RelativeDayBucket {
  const parsed = new Date(iso);
  if (!isValid(parsed)) return { kind: "unknown" };

  const startOfToday = startOfDay(now);
  const startOfThatDay = startOfDay(parsed);

  // today=0, yesterday=1, etc. (négatif si la date est future)
  const diffDays = differenceInCalendarDays(startOfToday, startOfThatDay);

  if (diffDays <= 0) return { kind: "today" };
  if (diffDays === 1) return { kind: "yesterday" };
  return { kind: "daysAgo", days: diffDays };
}

export function formatAbsoluteDateFr(iso: string): string {
  const parsed = new Date(iso);
  if (!isValid(parsed)) return iso;

  // équivalent "d MMM yyyy" en fr
  return format(parsed, "d MMM yyyy", { locale: fr });
}
