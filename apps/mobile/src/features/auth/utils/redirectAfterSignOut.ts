import type { Router } from "expo-router";

import { AUTH_ROUTES } from "../constants/authConstants";

type SignOutRouter = Pick<Router, "replace"> &
  Partial<Pick<Router, "canDismiss" | "dismissAll">>;

/**
 * Leaves the authenticated shell after sign-out.
 * Prefers dismissing stacked auth screens (e.g. OTP) so a later app reopen
 * does not restore `/(auth)/otp` without an active email flow.
 */
export function redirectAfterSignOut(
  router: SignOutRouter,
  options?: { hasSeenOnboarding?: boolean },
): void {
  const target =
    options?.hasSeenOnboarding === false ? "/onboarding" : AUTH_ROUTES.email;

  try {
    if (typeof router.canDismiss === "function" && router.canDismiss()) {
      router.dismissAll?.();
    }
  } catch {
    // Navigation may already be at the root of a group; replace below is enough.
  }

  router.replace(target);
}
