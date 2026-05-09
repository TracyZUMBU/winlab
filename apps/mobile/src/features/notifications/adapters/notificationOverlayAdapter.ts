import i18n from "@/src/i18n";

export type NotificationOverlayCopy = { title: string; body: string };

/**
 * Maps push payload `data` to localized title/body for in-app foreground UX.
 * Keep i18n and presentation concerns here, not in `notificationService`.
 */
export function getLocalizedNotificationOverlay(
  data: unknown,
): NotificationOverlayCopy | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const type = (data as { type?: unknown }).type;
  if (type === "referral_reward") {
    return {
      title: i18n.t("notifications.referral_reward.title"),
      body: i18n.t("notifications.referral_reward.body"),
    };
  }
  return null;
}
