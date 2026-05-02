import * as Notifications from "expo-notifications";
import { useEffect, useSyncExternalStore } from "react";

import {
  acquirePushCoordinator,
  getPushNotificationsSnapshot,
  subscribePushNotifications,
} from "../services/notificationService";

/**
 * Enregistre les notifications push pour l’utilisateur connecté (token → `profiles.push_token`)
 * et expose le dernier événement notification (foreground / tap).
 *
 * Ref-count interne : plusieurs montages (ex. plusieurs `useAppBootstrap`) ne dupliquent pas les listeners.
 *
 * @param enabled — quand `false`, n’acquiert pas le coordinateur (ex. bootstrap désactivé).
 */
export function usePushNotifications(enabled = true): {
  pushToken: string | null;
  isRegistered: boolean;
  notification: Notifications.Notification | null;
} {
  console.log("usePushNotifications");
  useEffect(() => {
    if (!enabled) {
      return;
    }
    return acquirePushCoordinator();
  }, [enabled]);

  return useSyncExternalStore(
    subscribePushNotifications,
    getPushNotificationsSnapshot,
    getPushNotificationsSnapshot,
  );
}
