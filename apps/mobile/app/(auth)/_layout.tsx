import { useAppBootstrap } from "@/src/lib/bootstrap/useAppBootstrap";
import {
  Stack,
  useLocalSearchParams,
  usePathname,
  useRouter,
} from "expo-router";
import React, { useEffect } from "react";
import {
  AUTH_ROUTES,
  isAuthPathname,
} from "@/src/features/auth/constants/authConstants";

export default function AuthLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ email?: string }>();
  const emailFromParams =
    typeof params.email === "string" ? params.email.trim() : "";

  // Guard côté auth:
  // - OTP avec email en params: flux login en cours → laisser tranquille
  // - OTP sans email (restauration après logout / reload) → email/onboarding
  // - session existante → home/create-profile
  // - pas de session sur create-profile → email/onboarding
  const {
    status,
    sessionUserId,
    profile,
    hasSeenOnboarding,
  } = useAppBootstrap(true);

  useEffect(() => {
    if (status !== "ready") return;

    const signedOutEntry = hasSeenOnboarding
      ? AUTH_ROUTES.email
      : "/onboarding";

    // Si l'utilisateur est authentifié, on impose la route correcte.
    if (sessionUserId) {
      if (profile) {
        if (pathname !== "/home") router.replace("/home");
        return;
      }

      if (!isAuthPathname(pathname, "createProfile")) {
        router.replace(AUTH_ROUTES.createProfile);
      }
      return;
    }

    // Pas de session: OTP n'est valide que pendant un flux avec email.
    if (isAuthPathname(pathname, "otp") && !emailFromParams) {
      router.replace(signedOutEntry);
      return;
    }

    if (isAuthPathname(pathname, "createProfile")) {
      router.replace(signedOutEntry);
    }
  }, [
    pathname,
    emailFromParams,
    sessionUserId,
    profile,
    hasSeenOnboarding,
    router,
    status,
  ]);

  if (status !== "ready") return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
