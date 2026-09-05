import type { TFunction } from "i18next";

const LOTTERY_CATEGORY_I18N_PREFIX = "lotteries.categories.";

export function lotteryCategoryTranslationKey(categoryId: string): string {
  return `${LOTTERY_CATEGORY_I18N_PREFIX}${categoryId}`;
}

/**
 * Libellé traduit pour une catégorie loterie connue ; fallback sur la valeur brute (ex. gift-card).
 */
export function resolveLotteryCategoryLabel(
  t: TFunction,
  category: string | null | undefined,
): string | null {
  const id = category?.trim();
  if (!id) {
    return null;
  }
  const key = lotteryCategoryTranslationKey(id);
  if (t(key) !== key) {
    return t(key);
  }
  return id;
}
