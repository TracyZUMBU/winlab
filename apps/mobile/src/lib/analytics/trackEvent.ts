import { logger } from "@/src/lib/logger";

/**
 * Central place for product analytics. In `__DEV__`, events are logged for
 * verification. In production, keep this a no-op until you wire a provider
 * (e.g. PostHog, Amplitude, Segment): call `client.capture(name, props)` here
 * and add the SDK init in app bootstrap.
 *
 * Lottery catalog (current events):
 * - `lotteries_catalog_enter` — `{ filter }` when the catalog route opens or
 *   the `filter` query param changes (search/category reset on that transition).
 * - (Category changes are not tracked yet; add if needed.)
 * - `lotteries_hub_catalog_cta` — bottom “Toutes les loteries” on the hub.
 * - `lotteries_hub_see_all_section` — `{ section: "endingSoon" | "featured" | "giftCard" }`.
 */
export function trackEvent(
  name: string,
  properties?: Record<string, unknown>,
): void {
  if (__DEV__) {
    logger.info(`analytics: ${name}`, properties);
  }
}
