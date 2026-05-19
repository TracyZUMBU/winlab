import type { LotteryFormBrandOption } from "../types/lotteryAdmin";

const DEFAULT_BRAND_SLUG = "winlab";

/** Valeur injectée au build par Vite ; sous Jest, repli sur `process.env`. */
function tryDefaultLotteryBrandIdFromEnv(): string {
  try {
    const v = __ADMIN_DEFAULT_LOTTERY_BRAND_ID__;
    if (typeof v === "string" && v.trim() !== "") {
      return v.trim();
    }
  } catch {
    /* Jest / exécution hors bundle Vite */
  }
  return process.env.VITE_ADMIN_DEFAULT_LOTTERY_BRAND_ID?.trim() ?? "";
}

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

  const envId = tryDefaultLotteryBrandIdFromEnv();
  if (envId.length > 0) {
    const byId = brands.find((b) => b.id === envId);
    if (byId) {
      return byId.id;
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
