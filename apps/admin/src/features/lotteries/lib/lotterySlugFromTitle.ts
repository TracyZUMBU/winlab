/**
 * Dérive un slug depuis un titre (miroir de `admin_lottery_slug_from_title` côté Postgres).
 */
export function lotterySlugFromTitle(title: string): string | null {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug.length > 0 ? slug : null;
}
