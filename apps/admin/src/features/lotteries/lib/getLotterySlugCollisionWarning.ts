import { lotterySlugFromTitle } from "./lotterySlugFromTitle";

const COLLISION_WARNING =
  "Un titre très similaire existe déjà ; un identifiant unique sera ajouté automatiquement.";

/**
 * Avertissement non bloquant si le slug dérivé du titre est déjà pris.
 */
export function getLotterySlugCollisionWarning(
  title: string,
  existingSlugs: readonly string[],
): string | null {
  const baseSlug = lotterySlugFromTitle(title);
  if (!baseSlug) {
    return null;
  }

  const normalized = new Set(
    existingSlugs
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0),
  );

  if (normalized.has(baseSlug)) {
    return COLLISION_WARNING;
  }

  return null;
}
