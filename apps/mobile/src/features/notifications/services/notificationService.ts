import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import i18n from "@/src/i18n";
import { logger } from "@/src/lib/logger";
import { getSupabaseClient } from "@/src/lib/supabase/client";
import { getCurrentSession, subscribeToAuthChanges } from "@/src/lib/supabase/session";

/** Sans ceci, iOS/Android peuvent ne rien afficher quand l’app est au premier plan. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PushNotificationsSnapshot = {
  pushToken: string | null;
  isRegistered: boolean;
  notification: Notifications.Notification | null;
};

const listeners = new Set<() => void>();

let snapshot: PushNotificationsSnapshot = {
  pushToken: null,
  isRegistered: false,
  notification: null,
};

function emit() {
  listeners.forEach((l) => {
    l();
  });
}

function setSnapshot(partial: Partial<PushNotificationsSnapshot>) {
  snapshot = { ...snapshot, ...partial };
  emit();
}

export function subscribePushNotifications(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPushNotificationsSnapshot(): PushNotificationsSnapshot {
  return snapshot;
}

let coordinatorRefCount = 0;
let coordinatorCleanup: (() => void) | null = null;

/** i18n copy for known notification types (foreground UX). */
export function getLocalizedNotificationOverlay(data: unknown): { title: string; body: string } | null {
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

async function registerForPushNotificationsAsync(
  userId: string,
): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  const projectId = String(
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
      ?.projectId ?? "",
  );

  if (!projectId) {
    logger.warn("[push] missing EAS projectId in app config");
    return null;
  }

  const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({ push_token: tokenResult.data })
    .eq("id", userId);

  if (error) {
    logger.warn("[push] failed to persist push_token", { code: error.code });
    return null;
  }

  return tokenResult.data;
}

function attachNotificationListeners(): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener((n) => {
    setSnapshot({ notification: n });
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((r) => {
    setSnapshot({ notification: r.notification });
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

async function syncPushForUser(userId: string | null) {
  if (!userId) {
    setSnapshot({ pushToken: null, isRegistered: false });
    return;
  }

  try {
    const token = await registerForPushNotificationsAsync(userId);
    setSnapshot({
      pushToken: token,
      isRegistered: Boolean(token),
    });
  } catch (error) {
    logger.warn("[push] registration failed", { error });
    setSnapshot({ pushToken: null, isRegistered: false });
  }
}

function startCoordinator(): () => void {
  const removeListeners = attachNotificationListeners();

  /** One in-flight `syncPushForUser` per user key (avoids init race subscribe vs getCurrentSession). */
  const syncInFlightByKey = new Map<string, Promise<void>>();

  function requestSyncPushForUser(userId: string | null): void {
    const key = userId ?? "__signed_out__";
    const existing = syncInFlightByKey.get(key);
    if (existing) {
      void existing;
      return;
    }
    const p = syncPushForUser(userId).finally(() => {
      syncInFlightByKey.delete(key);
    });
    syncInFlightByKey.set(key, p);
  }

  const unsubAuth = subscribeToAuthChanges((session) => {
    requestSyncPushForUser(session?.user?.id ?? null);
  });

  void getCurrentSession().then(({ user }) => {
    requestSyncPushForUser(user?.id ?? null);
  });

  return () => {
    unsubAuth();
    removeListeners();
  };
}

/** Ref-counted: safe when multiple `useAppBootstrap` instances mount (same layouts). */
export function acquirePushCoordinator(): () => void {
  coordinatorRefCount += 1;
  if (coordinatorRefCount === 1) {
    coordinatorCleanup = startCoordinator();
  }
  return () => {
    coordinatorRefCount -= 1;
    if (coordinatorRefCount <= 0) {
      coordinatorRefCount = 0;
      coordinatorCleanup?.();
      coordinatorCleanup = null;
      setSnapshot({ pushToken: null, isRegistered: false, notification: null });
    }
  };
}
