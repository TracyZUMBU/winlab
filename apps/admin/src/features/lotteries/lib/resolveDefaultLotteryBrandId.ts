import type { LotteryFormBrandOption } from "../types/lotteryAdmin";

const DEFAULT_BRAND_SLUG = "winlab";

/**
 * Marque par défaut du formulaire création loterie :
 * `VITE_ADMIN_DEFAULT_LOTTERY_BRAND_ID` si présente et valide, sinon slug `winlab`.
 */
export function resolveDefaultLotteryBrandId(
  brands: LotteryFormBrandOption[],
): string {
  if (brands.length === 0) {
    return "";
  }

  const envId = import.meta.env.VITE_ADMIN_DEFAULT_LOTTERY_BRAND_ID;
  if (typeof envId === "string") {
    const trimmed = envId.trim();
    if (trimmed.length > 0) {
      const byId = brands.find((b) => b.id === trimmed);
      if (byId) {
        return byId.id;
      }
    }
  }

  const bySlug = brands.find(
    (b) => b.slug.trim().toLowerCase() === DEFAULT_BRAND_SLUG,
  );
  if (bySlug) {
    return bySlug.id;
  }

  return "";
}
