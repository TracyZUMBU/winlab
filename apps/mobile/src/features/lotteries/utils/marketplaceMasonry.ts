/**
 * Width/height ratios for the left column (taller images = smaller ratio).
 * Right-column images use (3/2) × these values so image height is 2/3 of the
 * paired left slot at the same index (same column width: h_r = (2/3) × h_l).
 */
const LEFT_IMAGE_ASPECTS = [3 / 4, 11 / 15, 4 / 5] as const;

export type MarketplaceMasonryColumn = "left" | "right";

export function marketplaceImageAspect(
  column: MarketplaceMasonryColumn,
  indexInColumn: number,
): number {
  const i = indexInColumn % LEFT_IMAGE_ASPECTS.length;
  const leftAspect = LEFT_IMAGE_ASPECTS[i];
  if (column === "left") {
    return leftAspect;
  }
  return (3 / 2) * leftAspect;
}
