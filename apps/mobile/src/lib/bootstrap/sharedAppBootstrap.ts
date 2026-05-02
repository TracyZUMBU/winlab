import { AUTH_ROUTES } from "@/src/features/auth/constants/authConstants";
import type { DailyLoginMissionResult } from "@/src/features/missions/hooks/useDailyLoginMission";
import { triggerDailyLoginMission } from "@/src/features/missions/hooks/useDailyLoginMission";
import { getProfileByUserId } from "@/src/features/profile/services/getProfileByUserId";
import type { Profile } from "@/src/features/profile/types/profileTypes";
import { logger } from "@/src/lib/logger";
import { monitoring } from "@/src/lib/monitoring";
import { readHasSeenOnboarding } from "@/src/lib/onboardingStorage";
import { getCurrentSession } from "@/src/lib/supabase/session";

/** Snapshot returned by bootstrap (without React loading flag). */
export type AppBootstrapPayload = {
  profile: Profile | null;
  hasSeenOnboarding: boolean;
  sessionUserId: string | null;
  redirectTo: string | null;
  dailyLoginMissionResult: DailyLoginMissionResult | null;
};

type BootstrapCacheEntry = {
  sessionUserId: string | null;
  hasSeenOnboarding: boolean;
  payload: AppBootstrapPayload;
};

/** RPC peut répondre "alreadyCompleted" sur un 2e chargement alors que le 1er a bien attribué les jetons (effets React annulés). On réinjecte l’état récompense pour la modale. */
type PendingDailyLoginUiOverride = {
  userId: string;
  utcDay: string;
  tokensEarned: number;
};

let pendingDailyLoginUiOverride: PendingDailyLoginUiOverride | null = null;

function utcCalendarDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function applyPendingDailyLoginUiOverride(
  payload: AppBootstrapPayload,
): AppBootstrapPayload {
  const o = pendingDailyLoginUiOverride;
  if (!o || !payload.sessionUserId || payload.sessionUserId !== o.userId) {
    return payload;
  }
  const today = utcCalendarDay();
  if (today !== o.utcDay) {
    return payload;
  }

  const dl = payload.dailyLoginMissionResult;
  if (dl && !dl.alreadyCompleted) {
    return payload;
  }

  return {
    ...payload,
    dailyLoginMissionResult: {
      alreadyCompleted: false,
      tokensEarned: o.tokensEarned,
    },
  };
}

/** À appeler après fermeture de la modale récompense / logout pour ne pas ré-afficher à tort. */
export function clearPendingDailyLoginUiOverride(): void {
  pendingDailyLoginUiOverride = null;
}

let cachedBootstrap: BootstrapCacheEntry | null = null;
let bootstrapInFlight: Promise<AppBootstrapPayload> | null = null;
/** Bumped on invalidate so late async loads cannot repopulate cache after sign-out / profile refresh. */
let bootstrapEpoch = 0;

/** Serialize DB bootstrap work so two invalidates cannot run `triggerDailyLoginMission` in parallel. */
let bootstrapSerializationTail: Promise<unknown> = Promise.resolve();

function runBootstrapSerialized(): Promise<AppBootstrapPayload> {
  const next = bootstrapSerializationTail.then(() =>
    loadBootstrapOrFallback(),
  );
  bootstrapSerializationTail = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

/** Notifies every `useAppBootstrap` to reload after cache invalidation (e.g. profile created). */
let bootstrapCacheBumpVersion = 0;
const bootstrapCacheBumpListeners = new Set<() => void>();

export function subscribeBootstrapCacheBump(
  onStoreChange: () => void,
): () => void {
  bootstrapCacheBumpListeners.add(onStoreChange);
  return () => {
    bootstrapCacheBumpListeners.delete(onStoreChange);
  };
}

export function getBootstrapCacheBumpVersion(): number {
  return bootstrapCacheBumpVersion;
}

function notifyBootstrapCacheBump(): void {
  bootstrapCacheBumpVersion += 1;
  bootstrapCacheBumpListeners.forEach((fn) => {
    fn();
  });
}

/** Coalesce plusieurs `invalidateAppBootstrapCache` dans la même tick → un seul reload React. */
let bootstrapCacheBumpMicrotaskScheduled = false;

function scheduleBootstrapCacheBump(): void {
  if (bootstrapCacheBumpMicrotaskScheduled) {
    return;
  }
  bootstrapCacheBumpMicrotaskScheduled = true;
  queueMicrotask(() => {
    bootstrapCacheBumpMicrotaskScheduled = false;
    notifyBootstrapCacheBump();
  });
}

/**
 * Clears bootstrap memoization so the next call reloads session/profile/daily login.
 * Call after sign-out and after actions that change bootstrap-derived state (e.g. profile created).
 */
export function invalidateAppBootstrapCache(): void {
  bootstrapEpoch++;
  cachedBootstrap = null;
  bootstrapInFlight = null;
  scheduleBootstrapCacheBump();
}

async function runBootstrapForSession(
  sessionUserId: string | null,
  hasSeenOnboarding: boolean,
): Promise<AppBootstrapPayload> {
  let profile: Profile | null = null;
  let dailyLoginMissionResult: DailyLoginMissionResult | null = null;

  if (sessionUserId) {
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

    // mission_completions FK → profiles: cannot submit daily_login before a profile row exists.
    if (profile) {
      try {
        dailyLoginMissionResult = await triggerDailyLoginMission(
          profile.created_at,
        );
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
  }

  let redirectTo: string;
  if (!sessionUserId) {
    redirectTo = hasSeenOnboarding ? AUTH_ROUTES.email : "/onboarding";
  } else {
    redirectTo = profile ? "/home" : AUTH_ROUTES.createProfile;
  }

  if (
    sessionUserId &&
    dailyLoginMissionResult &&
    !dailyLoginMissionResult.alreadyCompleted
  ) {
    pendingDailyLoginUiOverride = {
      userId: sessionUserId,
      utcDay: utcCalendarDay(),
      tokensEarned: dailyLoginMissionResult.tokensEarned,
    };
  }

  return {
    profile,
    hasSeenOnboarding,
    sessionUserId,
    redirectTo,
    dailyLoginMissionResult,
  };
}

async function loadBootstrapOrFallback(): Promise<AppBootstrapPayload> {
  try {
    const [sessionData, hasSeenOnboarding] = await Promise.all([
      getCurrentSession(),
      readHasSeenOnboarding(),
    ]);
    const sessionUserId = sessionData.user?.id ?? null;
    return await runBootstrapForSession(sessionUserId, hasSeenOnboarding);
  } catch (error) {
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
    return {
      profile: null,
      hasSeenOnboarding: false,
      sessionUserId: null,
      redirectTo: "/onboarding",
      dailyLoginMissionResult: null,
    };
  }
}

/**
 * Shared bootstrap for all `useAppBootstrap` subscribers: one in-flight load and a short-lived
 * cache per (sessionUserId, hasSeenOnboarding) so `triggerDailyLoginMission` is not run twice
 * when root + nested layouts mount (which previously hid the daily reward modal).
 */
export async function resolveSharedAppBootstrapPayload(): Promise<AppBootstrapPayload> {
  const [sessionData, hasSeenOnboarding] = await Promise.all([
    getCurrentSession(),
    readHasSeenOnboarding(),
  ]);
  const sessionUserId = sessionData.user?.id ?? null;

  if (
    cachedBootstrap &&
    cachedBootstrap.sessionUserId === sessionUserId &&
    cachedBootstrap.hasSeenOnboarding === hasSeenOnboarding
  ) {
    return applyPendingDailyLoginUiOverride(cachedBootstrap.payload);
  }

  if (!bootstrapInFlight) {
    const epochAtStart = bootstrapEpoch;
    bootstrapInFlight = runBootstrapSerialized()
      .then((payload) => {
        const merged = applyPendingDailyLoginUiOverride(payload);
        if (epochAtStart === bootstrapEpoch) {
          cachedBootstrap = {
            sessionUserId: merged.sessionUserId,
            hasSeenOnboarding: merged.hasSeenOnboarding,
            payload: merged,
          };
        }
        return merged;
      })
      .finally(() => {
        bootstrapInFlight = null;
      });
  }

  return bootstrapInFlight;
}
