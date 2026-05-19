/** Fuseau affiché / saisi dans le formulaire création loterie (stockage API en UTC). */
export const LOTTERY_FORM_TIMEZONE = "Europe/Paris";

export type ParisWallDateTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Parties calendrier + horloge d’un instant, interprétées en Europe/Paris. */
export function getParisWallParts(instant: Date): ParisWallDateTime {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: LOTTERY_FORM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    fmt.formatToParts(instant).map((p) => [p.type, p.value]),
  ) as Record<string, string>;

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

/** Ajoute des jours calendaires (Y-M-D), indépendamment du fuseau. */
export function addCalendarDays(
  year: number,
  month: number,
  day: number,
  days: number,
): Pick<ParisWallDateTime, "year" | "month" | "day"> {
  const t = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: t.getUTCFullYear(),
    month: t.getUTCMonth() + 1,
    day: t.getUTCDate(),
  };
}

/** Convertit une date/heure murale Paris en instant UTC. */
export function parisWallTimeToUtc(wall: ParisWallDateTime): Date {
  const { year, month, day, hour, minute } = wall;
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);

  for (let i = 0; i < 4; i++) {
    const parts = getParisWallParts(new Date(utcMs));
    const wantMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
    const gotMs = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      0,
      0,
    );
    utcMs += wantMs - gotMs;
  }

  return new Date(utcMs);
}

/** Format `datetime-local` (sans fuseau) pour un instant, en heure Paris. */
export function formatDateTimeLocalParis(instant: Date): string {
  const p = getParisWallParts(instant);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}`;
}

const DATETIME_LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** Parse une valeur `datetime-local` comme heure murale Paris → `Date` UTC. */
export function parseDateTimeLocalParis(value: string): Date | null {
  const trimmed = value.trim();
  const match = DATETIME_LOCAL_RE.exec(trimmed);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (
    [year, month, day, hour, minute].some(
      (n) => !Number.isFinite(n) || Number.isNaN(n),
    )
  ) {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return parisWallTimeToUtc({ year, month, day, hour, minute });
}

/** Parse `datetime-local` Paris → ISO UTC (pour RPC), ou `null` si invalide. */
export function parisLocalDateTimeToIso(value: string): string | null {
  const parsed = parseDateTimeLocalParis(value);
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

export type DefaultLotteryScheduleLocalParis = {
  startsAtLocal: string;
  endsAtLocal: string;
  drawAtLocal: string;
};

/**
 * Valeurs par défaut du calendrier (heure Paris, champs `datetime-local`) :
 * - ouverture : maintenant
 * - fin : J+21 à 23:59
 * - tirage : lendemain de la date de fin à 12:00
 */
export function getDefaultLotteryScheduleLocalParis(
  now: Date = new Date(),
): DefaultLotteryScheduleLocalParis {
  const startsAtLocal = formatDateTimeLocalParis(now);
  const startParis = getParisWallParts(now);

  const endYmd = addCalendarDays(
    startParis.year,
    startParis.month,
    startParis.day,
    21,
  );
  const endsAtUtc = parisWallTimeToUtc({
    ...endYmd,
    hour: 23,
    minute: 59,
  });

  const endParis = getParisWallParts(endsAtUtc);
  const drawYmd = addCalendarDays(
    endParis.year,
    endParis.month,
    endParis.day,
    1,
  );
  const drawAtUtc = parisWallTimeToUtc({
    ...drawYmd,
    hour: 12,
    minute: 0,
  });

  return {
    startsAtLocal,
    endsAtLocal: formatDateTimeLocalParis(endsAtUtc),
    drawAtLocal: formatDateTimeLocalParis(drawAtUtc),
  };
}
