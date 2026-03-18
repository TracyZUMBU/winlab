import { OnboardingScreen } from "@/src/features/onboarding/screens/OnboardingScreen";
import { useAppBootstrap } from "@/src/lib/bootstrap/useAppBootstrap";
import { usePathname, useRouter } from "expo-router";
import { useEffect } from "react";

export default function Onboarding() {
  const router = useRouter();
  const pathname = usePathname();

  const { status, redirectTo } = useAppBootstrap(true);

  useEffect(() => {
    if (status !== "ready") return;
    if (!redirectTo) return;

    if (redirectTo !== pathname) {
      router.replace(redirectTo as any);
    }
  }, [pathname, redirectTo, router, status]);

  if (status !== "ready") return null;

  return <OnboardingScreen />;
}
