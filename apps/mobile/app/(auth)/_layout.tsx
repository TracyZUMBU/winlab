import { useAppBootstrap } from "@/src/lib/bootstrap/useAppBootstrap";
import { Stack, usePathname, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { AUTH_ROUTES } from "@/src/features/auth/constants/authConstants";

export default function AuthLayout() {
  const router = useRouter();
  const pathname = usePathname();

  // Guard côté auth:
  // - ne jamais casser le flow OTP: si pas de session, on laisse email/otp tranquilles
  // - en revanche, si une session existe, on force l'utilisateur vers home/create-profile
  // - si pas de session et qu'on tente d'accéder à create-profile => redirection email/onboarding
  const {
    status,
    sessionUserId,
    profile,
    hasSeenOnboarding,
  } = useAppBootstrap(true);

  useEffect(() => {
    if (status !== "ready") return;

    // Si l'utilisateur est authentifié, on impose la route correcte.
    if (sessionUserId) {
      if (profile) {
        if (pathname !== "/home") router.replace("/home");
        return;
      }

      if (pathname !== AUTH_ROUTES.createProfile) {
        router.replace(AUTH_ROUTES.createProfile);
      }
      return;
    }

    // Pas de session: on protège uniquement create-profile.
    if (pathname === AUTH_ROUTES.createProfile) {
      router.replace(
        hasSeenOnboarding ? AUTH_ROUTES.email : "/onboarding",
      );
    }
  }, [pathname, sessionUserId, profile, hasSeenOnboarding, router, status]);

  if (status !== "ready") return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
