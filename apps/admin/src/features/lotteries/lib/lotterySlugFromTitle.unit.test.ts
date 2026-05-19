import { lotterySlugFromTitle } from "./lotterySlugFromTitle";

describe("lotterySlugFromTitle", () => {
  it("derives a lowercase hyphenated slug from title", () => {
    expect(lotterySlugFromTitle("  Loterie Printemps 2026  ")).toBe(
      "loterie-printemps-2026",
    );
  });

  it("strips non-ascii alphanumeric characters like SQL", () => {
    expect(lotterySlugFromTitle("Loterie été")).toBe("loterie-t");
  });

  it("returns null for empty title", () => {
    expect(lotterySlugFromTitle("   ")).toBeNull();
    expect(lotterySlugFromTitle("!!!")).toBeNull();
  });
});
