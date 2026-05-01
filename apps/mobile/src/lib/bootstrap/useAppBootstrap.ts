import { AUTH_ROUTES } from "@/src/features/auth/constants/authConstants";
import type { DailyLoginMissionResult } from "@/src/features/missions/hooks/useDailyLoginMission";
import { triggerDailyLoginMission } from "@/src/features/missions/hooks/useDailyLoginMission";
import { getProfileByUserId } from "@/src/features/profile/services/getProfileByUserId";
import type { Profile } from "@/src/features/profile/types/profileTypes";
import { logger } from "@/src/lib/logger";
import { monitoring } from "@/src/lib/monitoring";
import { readHasSeenOnboarding } from "@/src/lib/onboardingStorage";
import { getCurrentSession } from "@/src/lib/supabase/session";
import { useEffect, useState } from "react";

export type AppBootstrapStatus = "idle" | "loading" | "ready";

export type AppBootstrapResult = {
  status: AppBootstrapStatus;
  profile: Profile | null;
  hasSeenOnboarding: boolean;
  sessionUserId: string | null;
  redirectTo: string | null;
  dailyLoginMissionResult: DailyLoginMissionResult | null;
};

/**
 * Bootstrap applicatif minimal:
 * - session Supabase
 * - profil en base
 * - état local onboarding (device)
 */
export function useAppBootstrap(enabled: boolean): AppBootstrapResult {
  const [state, setState] = useState<AppBootstrapResult>({
    status: "idle",
    profile: null,
    hasSeenOnboarding: false,
    sessionUserId: null,
    redirectTo: null,
    dailyLoginMissionResult: null,
  });

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    const load = async () => {
      setState((prev) => ({ ...prev, status: "loading" }));

      try {
        const [sessionData, hasSeen] = await Promise.all([
          getCurrentSession(),
          readHasSeenOnboarding(),
        ]);

        const sessionUserId = sessionData.user?.id ?? null;

        let profile: Profile | null = null;
        let dailyLoginMissionResult: DailyLoginMissionResult | null = null;
        if (sessionUserId) {
          //1. get profile
          try {
            profile = await getProfileByUserId(sessionUserId);
          } catch (error) {
            logger.warn(
              "[bootstrap] profile fetch failed; treating as no profile (same redirect as absent row)",
              {
                userId: sessionUserId,
                error,
              },
            );
            monitoring.captureException({
              name: "bootstrap_profile_fetch_failed",
              severity: "warning",
              feature: "bootstrap",
              message:
                "Profile fetch failed during bootstrap; UX fallback matches missing profile",
              error,
              userId: sessionUserId,
              extra: { action: "getProfileByUserId" },
            });
            profile = null;
          }

          //2. trigger daily login mission
          try {
            dailyLoginMissionResult = await triggerDailyLoginMission();
          } catch (error) {
            logger.warn(
              "[bootstrap] daily login mission trigger failed; continuing without mission result",
              { userId: sessionUserId, error },
            );
            monitoring.captureException({
              name: "bootstrap_daily_login_mission_failed",
              severity: "warning",
              feature: "bootstrap",
              message: "Daily login mission trigger failed during bootstrap",
              error,
              userId: sessionUserId,
              extra: { action: "triggerDailyLoginMission" },
            });
            dailyLoginMissionResult = null;
          }
        }

        //3. redirect to the right route
        let redirectTo: string;
        if (!sessionUserId) {
          redirectTo = hasSeen ? AUTH_ROUTES.email : "/onboarding";
        } else {
          redirectTo = profile ? "/home" : AUTH_ROUTES.createProfile;
        }

        if (isMounted) {
          setState({
            status: "ready",
            profile,
            hasSeenOnboarding: hasSeen,
            sessionUserId,
            redirectTo,
            dailyLoginMissionResult,
          });
        }
      } catch (error) {
        // conservative behavior: if session/hasSeenOnboarding fails, we send to onboarding.
        logger.warn(
          "[bootstrap] session or onboarding read failed; redirecting to onboarding",
          {
            error,
          },
        );
        monitoring.captureException({
          name: "app_bootstrap_failed",
          severity: "error",
          feature: "bootstrap",
          message: "App bootstrap failed",
          error,
        });
        if (isMounted) {
          setState({
            status: "ready",
            profile: null,
            hasSeenOnboarding: false,
            sessionUserId: null,
            redirectTo: "/onboarding",
            dailyLoginMissionResult: null,
          });
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  return state;
}
