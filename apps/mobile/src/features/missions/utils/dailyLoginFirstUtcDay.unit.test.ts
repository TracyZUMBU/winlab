import { isDailyLoginIneligibleFirstUtcDay } from "./dailyLoginFirstUtcDay";

describe("isDailyLoginIneligibleFirstUtcDay", () => {
  it("returns false when created_at is missing", () => {
    const ref = new Date("2026-05-02T12:00:00.000Z");
    expect(isDailyLoginIneligibleFirstUtcDay(null, ref)).toBe(false);
    expect(isDailyLoginIneligibleFirstUtcDay(undefined, ref)).toBe(false);
    expect(isDailyLoginIneligibleFirstUtcDay("", ref)).toBe(false);
  });

  it("returns true when today UTC is the same calendar day as created_at", () => {
    const ref = new Date("2026-05-02T23:00:00.000Z");
    expect(
      isDailyLoginIneligibleFirstUtcDay("2026-05-02T08:00:00.000Z", ref),
    ).toBe(true);
  });

  it("returns false when today UTC is strictly after the signup UTC day", () => {
    const ref = new Date("2026-05-03T00:30:00.000Z");
    expect(
      isDailyLoginIneligibleFirstUtcDay("2026-05-02T23:59:59.999Z", ref),
    ).toBe(false);
  });
});
