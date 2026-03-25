import { getProfileByUserId } from "@/src/features/profile/services/getProfileByUserId";
import { logger } from "@/src/lib/logger";
import { monitoring } from "@/src/lib/monitoring";
import type { Router } from "expo-router";
import { Profile } from "../../profile/types/profileTypes";
import { AUTH_ROUTES } from "../constants/authConstants";

export async function redirectAfterAuthSession(
  router: Pick<Router, "replace">,
  userId: string,
): Promise<void> {
  let profile: Profile | null = null;
  try {
    profile = await getProfileByUserId(userId);
  } catch (error) {
    logger.warn(
      "[auth] redirectAfterAuthSession: profile fetch failed; defaulting to create-profile flow",
      { userId, error },
    );
    monitoring.captureException({
      name: "redirect_after_auth_profile_fetch_failed",
      severity: "warning",
      feature: "auth",
      message:
        "Profile fetch failed after auth; UX fallback to create-profile (same as missing profile)",
      error,
      userId,
      extra: { action: "getProfileByUserId" },
    });
    router.replace({ pathname: AUTH_ROUTES.createProfile });
    return;
  }

  if (profile) {
    router.replace(AUTH_ROUTES.appIndex);
    return;
  }

  router.replace({ pathname: AUTH_ROUTES.createProfile });
}
