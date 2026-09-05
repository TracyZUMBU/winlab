import {
  formatLotteryCategoryLabel,
  getLotteryCategoryLabel,
  getLotteryCategoryOptionsList,
  isLotteryCategoryId,
} from "./lotteryCategories";

describe("lotteryCategories", () => {
  it("exposes bilingual labels for each category", () => {
    expect(getLotteryCategoryLabel("entertainment", "fr")).toBe("Divertissement");
    expect(getLotteryCategoryLabel("entertainment", "en")).toBe("Entertainment");
    expect(getLotteryCategoryLabel("mode", "fr")).toBe("Mode");
    expect(getLotteryCategoryLabel("mode", "en")).toBe("Fashion");
  });

  it("builds select options for a locale", () => {
    expect(getLotteryCategoryOptionsList("en")).toEqual([
      { id: "entertainment", label: "Entertainment" },
      { id: "animal", label: "Animal" },
      { id: "mode", label: "Fashion" },
      { id: "tech", label: "Tech" },
      { id: "restaurant", label: "Restaurant" },
      { id: "food", label: "Food" },
      { id: "sports", label: "Sports" },
      { id: "wellness", label: "Wellness" },
      { id: "beauty", label: "Beauty" },
      { id: "travel", label: "Travel" },
      { id: "kid", label: "Kids" },
      { id: "unknown", label: "Unknown" },
    ]);
  });

  it("formats known and unknown categories", () => {
    expect(formatLotteryCategoryLabel("tech", "fr")).toBe("Tech");
    expect(formatLotteryCategoryLabel("gift-card", "fr")).toBe("gift-card");
    expect(formatLotteryCategoryLabel(null, "fr")).toBe("—");
  });

  it("validates category ids", () => {
    expect(isLotteryCategoryId("tech")).toBe(true);
    expect(isLotteryCategoryId("beauty")).toBe(true);
    expect(isLotteryCategoryId("gift-card")).toBe(false);
  });
});
