import {
  formatDateTimeLocalParis,
  getDefaultLotteryScheduleLocalParis,
  getParisWallParts,
  parseDateTimeLocalParis,
  parisLocalDateTimeToIso,
} from "./lotteryFormParisTime";

describe("lotteryFormParisTime", () => {
  it("round-trips datetime-local through Paris wall time", () => {
    const local = "2026-07-15T14:30";
    const utc = parseDateTimeLocalParis(local);
    expect(utc).not.toBeNull();
    expect(formatDateTimeLocalParis(utc!)).toBe(local);
  });

  it("builds default schedule: +21 days end at 23:59, draw next day 12:00 Paris", () => {
    const now = new Date("2026-03-10T10:00:00.000Z");
    const schedule = getDefaultLotteryScheduleLocalParis(now);

    expect(schedule.startsAtLocal).toMatch(/^2026-03-10T/);

    const endUtc = parseDateTimeLocalParis(schedule.endsAtLocal)!;
    const endParis = getParisWallParts(endUtc);
    const startParis = getParisWallParts(now);

    expect(endParis.hour).toBe(23);
    expect(endParis.minute).toBe(59);

    const startUtcMidnight = Date.UTC(
      startParis.year,
      startParis.month - 1,
      startParis.day,
    );
    const endUtcMidnight = Date.UTC(
      endParis.year,
      endParis.month - 1,
      endParis.day,
    );
    const dayDiff = (endUtcMidnight - startUtcMidnight) / (24 * 60 * 60 * 1000);
    expect(dayDiff).toBe(21);

    const drawUtc = parseDateTimeLocalParis(schedule.drawAtLocal)!;
    const drawParis = getParisWallParts(drawUtc);
    expect(drawParis.hour).toBe(12);
    expect(drawParis.minute).toBe(0);

    const drawUtcMidnight = Date.UTC(
      drawParis.year,
      drawParis.month - 1,
      drawParis.day,
    );
    const drawDayAfterEnd =
      (drawUtcMidnight - endUtcMidnight) / (24 * 60 * 60 * 1000);
    expect(drawDayAfterEnd).toBe(1);
  });

  it("rejects impossible calendar dates", () => {
    expect(parseDateTimeLocalParis("2026-02-31T12:00")).toBeNull();
    expect(parseDateTimeLocalParis("2026-04-31T12:00")).toBeNull();
    expect(parseDateTimeLocalParis("2024-02-29T12:00")).not.toBeNull();
    expect(parseDateTimeLocalParis("2025-02-29T12:00")).toBeNull();
  });

  it("parisLocalDateTimeToIso returns UTC ISO string", () => {
    const iso = parisLocalDateTimeToIso("2026-01-15T12:00");
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
