import { marketplaceImageAspect } from "./marketplaceMasonry";

describe("marketplaceMasonry", () => {
  it("right column image aspect yields 2/3 of left image height (same width)", () => {
    const colW = 150;
    for (let i = 0; i < 5; i += 1) {
      const aL = marketplaceImageAspect("left", i);
      const aR = marketplaceImageAspect("right", i);
      const hL = colW / aL;
      const hR = colW / aR;
      expect(hR / hL).toBeCloseTo(2 / 3, 5);
      expect(aR / aL).toBeCloseTo(3 / 2, 5);
    }
  });
});
