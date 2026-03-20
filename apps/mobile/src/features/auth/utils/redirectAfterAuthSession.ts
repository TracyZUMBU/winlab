import { getProfileByUserId } from "@/src/features/profile/services/getProfileByUserId";
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
  } catch {
    // On error, default to profile creation flow
    router.replace({ pathname: AUTH_ROUTES.createProfile });
    return;
  }

  if (profile) {
    router.replace(AUTH_ROUTES.appIndex);
    return;
  }

  router.replace({ pathname: AUTH_ROUTES.createProfile });
}
