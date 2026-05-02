import "@/src/i18n";
import { AppCenteredModal } from "@/src/components/ui/AppCenteredModal";
import { userFacingQueryLoadHint } from "@/src/lib/i18n/userFacingErrorHint";
import { useAppBootstrap } from "@/src/lib/bootstrap/useAppBootstrap";
import {
  clearPendingDailyLoginUiOverride,
  invalidateAppBootstrapCache,
} from "@/src/lib/bootstrap/sharedAppBootstrap";
import { theme } from "@/src/theme";
import { queryClient } from "@/src/lib/query/queryClient";
import { useOtaUpdatePrompt } from "@/src/lib/updates/useOtaUpdatePrompt";
import { AppToastHost } from "@/src/shared/toast";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const { status, sessionUserId, redirectTo, dailyLoginMissionResult } =
    useAppBootstrap(true);

  const {
    visible: otaModalVisible,
    isApplying: otaApplying,
    applyUpdate: applyOtaUpdate,
    dismissLater: dismissOtaLater,
  } = useOtaUpdatePrompt();

  const [dailyRewardModal, setDailyRewardModal] = useState<{
    visible: boolean;
    tokensEarned: number;
  }>({ visible: false, tokensEarned: 0 });

  /** One modal per user per UTC day (avoids duplicate hooks / Strict Mode clearing timeouts). */
  const dailyRewardShownKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionUserId) {
      dailyRewardShownKeyRef.current = null;
    }
  }, [sessionUserId]);

  const pendingDailyRewardTokens =
    status === "ready" &&
    sessionUserId &&
    dailyLoginMissionResult &&
    !dailyLoginMissionResult.alreadyCompleted
      ? dailyLoginMissionResult.tokensEarned
      : null;

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
    if (pendingDailyRewardTokens == null) {
      return;
    }

    const utcDay = new Date().toISOString().slice(0, 10);
    const dedupeKey = `${sessionUserId}:${utcDay}:${pendingDailyRewardTokens}`;
    if (dailyRewardShownKeyRef.current === dedupeKey) {
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      dailyRewardShownKeyRef.current = dedupeKey;
      setDailyRewardModal({
        visible: true,
        tokensEarned: pendingDailyRewardTokens,
      });
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [pendingDailyRewardTokens, sessionUserId, status]);

  const dismissDailyRewardModal = () => {
    clearPendingDailyLoginUiOverride();
    setDailyRewardModal((s) => ({ ...s, visible: false }));
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View style={styles.root}>
            {status === "error" ? (
              <SafeAreaView style={styles.bootstrapError} edges={["top", "bottom"]}>
                <View style={styles.bootstrapErrorInner}>
                  <Text style={styles.bootstrapErrorText}>
                    {t("bootstrap.loadFailed")}
                  </Text>
                  <Text style={styles.bootstrapErrorHint}>
                    {userFacingQueryLoadHint(t)}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.bootstrapRetryButton,
                      pressed && styles.bootstrapRetryButtonPressed,
                    ]}
                    onPress={() => {
                      invalidateAppBootstrapCache();
                    }}
                  >
                    <Text style={styles.bootstrapRetryButtonText}>
                      {t("common.retry")}
                    </Text>
                  </Pressable>
                </View>
              </SafeAreaView>
            ) : (
              <>
                <Stack screenOptions={{ headerShown: false }} />
                <AppToastHost />
                <AppCenteredModal
                  visible={dailyRewardModal.visible}
                  onDismiss={dismissDailyRewardModal}
                  title={t("missions.dailyLogin.modalTitle")}
                  message={t("missions.dailyLogin.modalMessage", {
                    count: dailyRewardModal.tokensEarned,
                  })}
                  testID="daily-login-reward-modal"
                />
              </>
            )}
            <AppCenteredModal
              visible={otaModalVisible}
              onDismiss={dismissOtaLater}
              title={t("otaUpdate.title")}
              message={t("otaUpdate.message")}
              primaryActionLabel={t("otaUpdate.updateNow")}
              onPrimaryPress={() => {
                void applyOtaUpdate();
              }}
              secondaryActionLabel={t("otaUpdate.later")}
              onSecondaryPress={dismissOtaLater}
              primaryActionLoading={otaApplying}
              dismissOnBackdropPress={false}
              onRequestCloseOverride={dismissOtaLater}
              testID="ota-update-modal"
            />
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
  bootstrapError: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  bootstrapErrorInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  bootstrapErrorText: {
    ...theme.typography.cardBody,
    color: theme.colors.text,
    textAlign: "center",
    fontWeight: "600",
  },
  bootstrapErrorHint: {
    marginTop: theme.spacing.md,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  bootstrapRetryButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.accentSolid,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    minHeight: theme.layout.minTouchTarget,
    justifyContent: "center",
  },
  bootstrapRetryButtonPressed: {
    opacity: 0.92,
  },
  bootstrapRetryButtonText: {
    color: theme.colors.onAccent,
    fontWeight: "600",
  },
});
