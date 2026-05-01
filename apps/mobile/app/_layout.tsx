import "@/src/i18n";
import { useAppBootstrap } from "@/src/lib/bootstrap/useAppBootstrap";
import { queryClient } from "@/src/lib/query/queryClient";
import { AppToastHost } from "@/src/shared/toast";
import { showSuccessToast } from "@/src/shared/toast/toastService";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, usePathname, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const { status, redirectTo, dailyLoginMissionResult } = useAppBootstrap(true);
  const dailyToastShownRef = useRef(false);

  useEffect(() => {
    if (status !== "ready") return;
    if (pathname !== "/") return;
    if (!redirectTo) return;

    // avoid a redirect loop if we are already on the right route.
    if (redirectTo !== pathname) {
      router.replace(redirectTo as any);
    }
  }, [pathname, redirectTo, router, status]);

  useEffect(() => {
    if (status !== "ready") return;
    if (!dailyLoginMissionResult) return;

    if (dailyLoginMissionResult.alreadyCompleted) return;
    if (dailyToastShownRef.current) return;

    const timeoutId = setTimeout(() => {
      showSuccessToast({
        title: t("missions.dailyLogin.toastReward", {
          count: dailyLoginMissionResult.tokensEarned,
        }),
      });
      dailyToastShownRef.current = true;
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [dailyLoginMissionResult, status, t]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View style={styles.root}>
            <Stack screenOptions={{ headerShown: false }} />
            <AppToastHost />
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
