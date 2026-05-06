import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

import { AUTH_ROUTES } from "@/src/features/auth/constants/authConstants";
import { useAppBootstrap } from "@/src/lib/bootstrap/useAppBootstrap";

export default function AppLayout() {
  const router = useRouter();
  const { status, sessionUserId, profile, hasSeenOnboarding } =
    useAppBootstrap(true);

  useEffect(() => {
    if (status !== "ready") return;

    // guard: "(app)" requires a session + a profile.
    if (!sessionUserId) {
      router.replace(hasSeenOnboarding ? AUTH_ROUTES.email : "/onboarding");
      return;
    }

    if (!profile) {
      router.replace(AUTH_ROUTES.createProfile);
    }
  }, [status, sessionUserId, profile, hasSeenOnboarding, router]);

  if (status !== "ready") {
    // avoid a flash UI during the bootstrap.
    return null;
  }

  // Ne pas monter les écrans d’onglets tant que la garde n’a pas validé session + profil
  // (sinon un tab peut planter avant le `router.replace`, et l’erreur remonte de façon opaque).
  if (!sessionUserId || !profile) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="results" />
      <Stack.Screen name="referral" />
    </Stack>
  );
}
