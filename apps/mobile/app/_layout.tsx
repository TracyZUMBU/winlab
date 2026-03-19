import "@/src/i18n";
import { useAppBootstrap } from "@/src/lib/bootstrap/useAppBootstrap";
import { queryClient } from "@/src/lib/query/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
