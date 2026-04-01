import type { MarketplaceMasonryColumn } from "./marketplaceMasonry";

/**
 * FNV-1a 32-bit — stable, deterministic across runs (no Math.random).
 */
export function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type LotteryCardVariant = "compact" | "regular" | "tall";

const VARIANT_BY_HASH_MOD: readonly LotteryCardVariant[] = [
  "compact",
  "regular",
  "tall",
];

export function getLotteryCardVariant(id: string): LotteryCardVariant {
  return VARIANT_BY_HASH_MOD[hashString(id) % 3];
}

/** RN `aspectRatio` = width / height (fixed column width → taller card when value is lower). */
export const LOTTERY_VARIANT_IMAGE_ASPECT_RATIO: Record<
  LotteryCardVariant,
  number
> = {
  compact: 1.05,
  regular: 0.92,
  tall: 0.78,
};

const NORMALIZED_COLUMN_WIDTH = 100;
const CARD_MARGIN_BOTTOM = 16;

const STAGGER_TOP_OFFSETS = [0, 5, 10] as const;

export type LotteryCardLayoutInput = {
  id: string;
  user_active_tickets_count: number;
};

export type LotteryCardLayout = {
  variant: LotteryCardVariant;
  imageAspectRatio: number;
  estimatedHeight: number;
  topOffset: number;
};

function estimateBodyHeightPx(hasMyTicketsRow: boolean): number {
  const paddingVertical = 32;
  const titleBlock = 44;
  const gap = 8;
  const ctaBlock = 44;
  const base = paddingVertical + titleBlock + gap + ctaBlock;
  const tickets = hasMyTicketsRow ? 22 : 0;
  return base + tickets;
}

export function getLotteryCardLayout(
  input: LotteryCardLayoutInput,
): LotteryCardLayout {
  const variant = getLotteryCardVariant(input.id);
  const h = hashString(input.id);
  const topOffset = STAGGER_TOP_OFFSETS[h % 3];

  const imageAspectRatio = LOTTERY_VARIANT_IMAGE_ASPECT_RATIO[variant];
  const mediaHeightNorm = NORMALIZED_COLUMN_WIDTH / imageAspectRatio;
  const bodyPx = estimateBodyHeightPx(input.user_active_tickets_count > 0);

  return {
    variant,
    imageAspectRatio,
    estimatedHeight:
      mediaHeightNorm + bodyPx + CARD_MARGIN_BOTTOM + topOffset,
    topOffset,
  };
}

export type LotteryMasonryPlacement<T extends LotteryCardLayoutInput> = {
  item: T;
  layout: LotteryCardLayout;
  column: MarketplaceMasonryColumn;
  indexInColumn: number;
};

/**
 * Ordered shortest-column packing: assignments for items 0..k-1 depend only on
 * items 0..k-1, so appending pages does not reshuffle existing cards.
 */
export function splitLotteriesIntoMasonryColumns<T extends LotteryCardLayoutInput>(
  items: T[],
): {
  left: LotteryMasonryPlacement<T>[];
  right: LotteryMasonryPlacement<T>[];
} {
  let leftAccumulatedHeight = 0;
  let rightAccumulatedHeight = 0;
  const left: LotteryMasonryPlacement<T>[] = [];
  const right: LotteryMasonryPlacement<T>[] = [];

  for (const item of items) {
    const layout = getLotteryCardLayout(item);
    const packingWeight = layout.estimatedHeight;

    if (leftAccumulatedHeight <= rightAccumulatedHeight) {
      left.push({
        item,
        layout,
        column: "left",
        indexInColumn: left.length,
      });
      leftAccumulatedHeight += packingWeight;
    } else {
      right.push({
        item,
        layout,
        column: "right",
        indexInColumn: right.length,
      });
      rightAccumulatedHeight += packingWeight;
    }
  }

  return { left, right };
}

/** Skeleton: cycle aspects to echo real variant diversity. */
export const LOTTERY_CATALOG_SKELETON_VARIANT_CYCLE: readonly LotteryCardVariant[] =
  ["regular", "tall", "compact"];
