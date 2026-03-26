import {
  formatEndingSoonTime,
  formatFeaturedTime,
  getTimeRemaining,
} from "./lotteryTime";

function fakeT(key: string, params?: Record<string, unknown>) {
  // Minimal i18n stub for unit tests:
  // return a stable string so we can assert behavior.
  if (!params) return key;
  return `${key} ${JSON.stringify(params)}`;
}

describe("lotteryTime", () => {
  describe("getTimeRemaining", () => {
    it("returns ongoing when endsAt is null", () => {
      expect(getTimeRemaining(null, 1000)).toEqual({ kind: "ongoing" });
    });

    it("returns expired when endsAt is in the past", () => {
      expect(getTimeRemaining(new Date(0).toISOString(), 1000)).toEqual({
        kind: "expired",
      });
    });

    it("splits into days/hours/minutes", () => {
      const now = new Date("2026-01-01T00:00:00.000Z").getTime();
      const endsAt = new Date(
        now + (3 * 24 * 60 * 60 + 5 * 60 * 60 + 12 * 60) * 1000,
      ).toISOString();

      expect(getTimeRemaining(endsAt, now)).toEqual({
        days: 3,
        hours: 5,
        minutes: 12,
      });
    });
  });

  describe("formatEndingSoonTime", () => {
    it("uses lottery.time.ongoing for ongoing", () => {
      expect(formatEndingSoonTime(fakeT as any, { kind: "ongoing" })).toBe(
        "lottery.time.ongoing",
      );
    });

    it("uses lottery.time.zero for expired", () => {
      expect(formatEndingSoonTime(fakeT as any, { kind: "expired" })).toBe(
        "lottery.time.zero",
      );
    });

    it("uses daysHours when days > 0", () => {
      expect(
        formatEndingSoonTime(fakeT as any, { days: 2, hours: 3, minutes: 4 }),
      ).toBe('lottery.time.daysHours {"days":2,"hours":3}');
    });

    it("uses hoursMinutes when days === 0", () => {
      expect(
        formatEndingSoonTime(fakeT as any, { days: 0, hours: 2, minutes: 7 }),
      ).toBe('lottery.time.hoursMinutes {"hours":2,"minutes":7}');
    });
  });

  describe("formatFeaturedTime", () => {
    it("uses lotteries.time.inZero for expired", () => {
      expect(formatFeaturedTime(fakeT as any, { kind: "expired" })).toBe(
        "lotteries.time.inZero",
      );
    });

    it("uses inDays with count when days > 0", () => {
      expect(
        formatFeaturedTime(fakeT as any, { days: 1, hours: 20, minutes: 0 }),
      ).toBe('lotteries.time.inDays {"count":1}');
    });

    it("uses inHoursMinutes when days === 0", () => {
      expect(
        formatFeaturedTime(fakeT as any, { days: 0, hours: 5, minutes: 9 }),
      ).toBe('lotteries.time.inHoursMinutes {"hours":5,"minutes":9}');
    });
  });

  describe("formatGiftCardTime", () => {
    it("uses tomorrow when days === 1", () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { formatGiftCardTime } = require("./lotteryTime");
      expect(
        formatGiftCardTime(fakeT as any, { days: 1, hours: 2, minutes: 0 }),
      ).toBe("lotteries.time.tomorrow");
    });
  });
});

