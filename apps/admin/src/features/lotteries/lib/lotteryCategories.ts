/**
 * Catégories loterie autorisées à la création (valeurs persistées en base).
 * Les clés sont les identifiants stables ; les libellés FR/EN servent à l’UI.
 */
export type LotteryCategoryLocale = "fr" | "en";

export const LOTTERY_CATEGORY_LABELS = {
  entertainment: { fr: "Divertissement", en: "Entertainment" },
  animal: { fr: "Animal", en: "Animal" },
  mode: { fr: "Mode", en: "Fashion" },
  tech: { fr: "Tech", en: "Tech" },
  restaurant: { fr: "Restaurant", en: "Restaurant" },
  food: { fr: "Alimentation", en: "Food" },
  sports: { fr: "Sports", en: "Sports" },
  wellness: { fr: "Bien-être", en: "Wellness" },
  beauty: { fr: "Beauté", en: "Beauty" },
  travel: { fr: "Voyage", en: "Travel" },
  kid: { fr: "Enfants", en: "Kids" },
  unknown: { fr: "Inconnu", en: "Unknown" },
} as const satisfies Record<string, Record<LotteryCategoryLocale, string>>;

export type LotteryCategoryId = keyof typeof LOTTERY_CATEGORY_LABELS;

export const LOTTERY_CATEGORY_IDS = Object.keys(
  LOTTERY_CATEGORY_LABELS,
) as LotteryCategoryId[];

export type LotteryCategoryOption = {
  id: LotteryCategoryId;
  label: string;
};

export function isLotteryCategoryId(value: string): value is LotteryCategoryId {
  return LOTTERY_CATEGORY_IDS.includes(value as LotteryCategoryId);
}

export function getLotteryCategoryLabel(
  id: LotteryCategoryId,
  locale: LotteryCategoryLocale = "fr",
): string {
  return LOTTERY_CATEGORY_LABELS[id][locale];
}

export function getLotteryCategoryOptionsList(
  locale: LotteryCategoryLocale = "fr",
): LotteryCategoryOption[] {
  return LOTTERY_CATEGORY_IDS.map((id) => ({
    id,
    label: getLotteryCategoryLabel(id, locale),
  }));
}

export function formatLotteryCategoryLabel(
  category: string | null,
  locale: LotteryCategoryLocale = "fr",
): string {
  if (category == null || category.trim().length === 0) {
    return "—";
  }
  if (isLotteryCategoryId(category)) {
    return getLotteryCategoryLabel(category, locale);
  }
  return category;
}

export function lotteryCategoryTranslationKey(id: LotteryCategoryId): string {
  return `lotteries.categories.${id}`;
}
