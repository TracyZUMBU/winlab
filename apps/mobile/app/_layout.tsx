import "@/src/i18n";
import { useAppBootstrap } from "@/src/lib/bootstrap/useAppBootstrap";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const { status, redirectTo } = useAppBootstrap(pathname === "/");

  useEffect(() => {
    if (status !== "ready") return;
    if (pathname !== "/") return;
    if (!redirectTo) return;

    // avoid a redirect loop if we are already on the right route.
    if (redirectTo !== pathname) {
      router.replace(redirectTo as any);
    }
  }, [pathname, redirectTo, router, status]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
