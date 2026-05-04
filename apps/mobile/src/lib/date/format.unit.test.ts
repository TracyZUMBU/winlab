import { getRelativeDayBucketUtc } from "./format";

describe("getRelativeDayBucketUtc", () => {
  const ref = new Date("2026-05-04T12:00:00.000Z");

  it("returns yesterday when the instant is on the previous UTC calendar day", () => {
    expect(
      getRelativeDayBucketUtc("2026-05-03T22:13:10.678623+00:00", ref),
    ).toEqual({ kind: "yesterday" });
  });

  it("returns today when the instant is on the same UTC calendar day as now", () => {
    expect(
      getRelativeDayBucketUtc("2026-05-04T15:17:04.455243+00:00", ref),
    ).toEqual({ kind: "today" });
  });

  it("returns unknown for invalid iso", () => {
    expect(getRelativeDayBucketUtc("not-a-date", ref)).toEqual({
      kind: "unknown",
    });
  });
});
