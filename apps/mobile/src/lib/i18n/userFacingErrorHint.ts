import type { TFunction } from "i18next";

/**
 * Non-technical hint for TanStack Query / fetch error states.
 * Does not read `error.message` (UI safety net per project conventions).
 */
export function userFacingQueryLoadHint(t: TFunction): string {
  return t("common.errors.loadHint");
}
