import { usePushNotifications } from "@/src/features/notifications/hooks/usePushNotifications";
import { subscribeToAuthChanges } from "@/src/lib/supabase/session";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { AppBootstrapPayload } from "./sharedAppBootstrap";
import {
  getBootstrapCacheBumpVersion,
  invalidateAppBootstrapCache,
  resolveSharedAppBootstrapPayload,
  subscribeBootstrapCacheBump,
} from "./sharedAppBootstrap";

export type AppBootstrapStatus = "idle" | "loading" | "ready" | "error";

export type AppBootstrapResult = AppBootstrapPayload & {
  status: AppBootstrapStatus;
  /** Set when `status` is `"error"` after an unexpected bootstrap failure. */
  bootstrapError: unknown | null;
};

/**
 * Bootstrap applicatif minimal:
 * - session Supabase
 * - profil en base
 * - état local onboarding (device)
 *
 * Tous les écrans qui appellent ce hook partagent le même chargement (cache + promesse unique)
 * pour éviter un double `triggerDailyLoginMission` (récompense invisible).
 *
 * Recharge après changement d’utilisateur (connexion / déconnexion) pour ne pas garder
 * un snapshot « anonyme » une fois la session OTP créée.
 */
export function useAppBootstrap(enabled: boolean): AppBootstrapResult {
  usePushNotifications(enabled);

  const [state, setState] = useState<AppBootstrapResult>({
    status: "idle",
    bootstrapError: null,
    profile: null,
    hasSeenOnboarding: false,
    sessionUserId: null,
    redirectTo: null,
    dailyLoginMissionResult: null,
  });

  const [bootstrapReloadNonce, setBootstrapReloadNonce] = useState(0);
  /** Incrémenté dans `invalidateAppBootstrapCache` pour forcer un reload sur tous les hooks montés. */
  const cacheBumpVersion = useSyncExternalStore(
    subscribeBootstrapCacheBump,
    getBootstrapCacheBumpVersion,
    getBootstrapCacheBumpVersion,
  );
  /** `undefined` = avant le premier événement auth ; évite un reload doublon au cold start. */
  const lastAuthUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    const unsub = subscribeToAuthChanges((session) => {
      const nextUserId = session?.user?.id ?? null;

      if (lastAuthUserIdRef.current === undefined) {
        lastAuthUserIdRef.current = nextUserId;
        invalidateAppBootstrapCache();
        setBootstrapReloadNonce((n) => n + 1);
        return;
      }

      if (lastAuthUserIdRef.current === nextUserId) {
        return;
      }

      lastAuthUserIdRef.current = nextUserId;
      invalidateAppBootstrapCache();
      setBootstrapReloadNonce((n) => n + 1);
    });

    return unsub;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const load = async () => {
      setState((prev) => ({
        ...prev,
        status: "loading",
        bootstrapError: null,
      }));

      try {
        const payload = await resolveSharedAppBootstrapPayload();

        if (cancelled) {
          return;
        }

        setState({
          status: "ready",
          bootstrapError: null,
          ...payload,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState((prev) => ({
          ...prev,
          status: "error",
          bootstrapError: error,
        }));
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled, bootstrapReloadNonce, cacheBumpVersion]);

  return state;
}
