import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Notifications from "expo-notifications";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppHeaderFull } from "@/src/components/ui/AppHeaderFull";
import { Button } from "@/src/components/ui/Button";
import { ListGroup } from "@/src/components/ui/ListGroup";
import { Screen } from "@/src/components/ui/Screen";
import { ScreenSectionOverline } from "@/src/components/ui/ScreenSectionOverline";
import { logger } from "@/src/lib/logger";
import { showErrorToast } from "@/src/shared/toast";
import { theme } from "@/src/theme";

function isNotificationsPermissionGranted(
  status: Notifications.NotificationPermissionsStatus,
): boolean {
  if (status.granted) {
    return true;
  }
  if (
    status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }
  return false;
}

type PermissionLoadState =
  | { kind: "loading" }
  | { kind: "unsupported" }
  | { kind: "error" }
  | {
      kind: "ready";
      permissions: Notifications.NotificationPermissionsStatus;
    };

export function NotificationSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loadState, setLoadState] = useState<PermissionLoadState>({
    kind: "loading",
  });
  const [requestPending, setRequestPending] = useState(false);

  const refreshPermissions = useCallback(async () => {
    if (Platform.OS === "web") {
      setLoadState({ kind: "unsupported" });
      return;
    }

    setLoadState((prev) =>
      prev.kind === "ready" ? prev : { kind: "loading" },
    );

    try {
      const permissions = await Notifications.getPermissionsAsync();
      setLoadState({ kind: "ready", permissions });
    } catch (error: unknown) {
      logger.error("Notification permissions read failed", error);
      setLoadState({ kind: "error" });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshPermissions();
    }, [refreshPermissions]),
  );

  const onRequestPermission = useCallback(async () => {
    if (Platform.OS === "web") {
      return;
    }
    setRequestPending(true);
    try {
      const permissions = await Notifications.requestPermissionsAsync();
      setLoadState({ kind: "ready", permissions });
    } catch (error: unknown) {
      logger.error("Notification permission request failed", error);
      showErrorToast({
        title: t("profile.notificationsDetail.requestErrorTitle"),
        message: t("profile.notificationsDetail.requestErrorBody"),
      });
    } finally {
      setRequestPending(false);
    }
  }, [t]);

  const onOpenAppSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (error: unknown) {
      logger.error("Open app settings failed", error);
      showErrorToast({
        title: t("profile.notificationsDetail.openSettingsErrorTitle"),
        message: t("profile.notificationsDetail.openSettingsErrorBody"),
      });
    }
  }, [t]);

  const renderStatusBody = () => {
    if (loadState.kind === "loading") {
      return (
        <View style={styles.loadingBlock}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
          <Text style={styles.loadingHint}>
            {t("profile.notificationsDetail.loading")}
          </Text>
        </View>
      );
    }

    if (loadState.kind === "unsupported") {
      return (
        <Text style={styles.bodyMuted}>
          {t("profile.notificationsDetail.unsupported")}
        </Text>
      );
    }

    if (loadState.kind === "error") {
      return (
        <View style={styles.errorBlock}>
          <Text style={styles.errorText}>
            {t("profile.notificationsDetail.error")}
          </Text>
          <Button
            title={t("common.retry")}
            onPress={() => void refreshPermissions()}
            variant="soft"
          />
        </View>
      );
    }

    const { permissions } = loadState;
    const granted = isNotificationsPermissionGranted(permissions);
    const isUndetermined = permissions.status === "undetermined";

    const statusLabel = granted
      ? permissions.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL
        ? t("profile.notificationsDetail.status.provisional")
        : t("profile.notificationsDetail.status.enabled")
      : permissions.status === "denied"
        ? t("profile.notificationsDetail.status.disabled")
        : t("profile.notificationsDetail.status.undetermined");

    const statusChipStyle = granted
      ? styles.chipOn
      : permissions.status === "denied"
        ? styles.chipOff
        : styles.chipPending;

    const statusChipTextStyle = granted
      ? styles.chipOnText
      : permissions.status === "denied"
        ? styles.chipOffText
        : styles.chipPendingText;

    const hintKey = granted
      ? "profile.notificationsDetail.hintEnabled"
      : permissions.status === "denied"
        ? "profile.notificationsDetail.hintDisabled"
        : "profile.notificationsDetail.hintUndetermined";

    return (
      <View style={styles.statusBlock}>
        <View style={styles.statusRow}>
          <Text style={styles.statusTitle}>
            {t("profile.notificationsDetail.statusLabel")}
          </Text>
          <View style={[styles.statusChip, statusChipStyle]}>
            <Text style={[styles.statusChipText, statusChipTextStyle]}>
              {statusLabel}
            </Text>
          </View>
        </View>
        <Text style={styles.bodyMuted}>{t(hintKey)}</Text>
        {isUndetermined ? (
          <Button
            title={t("profile.notificationsDetail.requestCta")}
            onPress={() => void onRequestPermission()}
            disabled={requestPending}
            variant="primary"
            fullWidth
          />
        ) : null}
        {!granted && !isUndetermined ? (
          <Button
            title={t("profile.notificationsDetail.openSettingsCta")}
            onPress={() => void onOpenAppSettings()}
            variant="soft"
            fullWidth
          />
        ) : null}
      </View>
    );
  };

  return (
    <Screen edges={["top"]} style={styles.screen}>
      <View style={styles.topBar}>
        <AppHeaderFull
          title={t("profile.notificationsDetail.title")}
          titleAlign="center"
          showBottomBorder
          leftSlot={
            <Pressable
              onPress={() => router.back()}
              style={styles.iconCircle}
              accessibilityRole="button"
              accessibilityLabel={t("profile.notificationsDetail.a11yBack")}
            >
              <MaterialIcons
                name="arrow-back-ios-new"
                size={20}
                color={theme.colors.text}
              />
            </Pressable>
          }
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenSectionOverline
          label={t("profile.notificationsDetail.sectionStatus")}
        />
        <ListGroup>{renderStatusBody()}</ListGroup>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    paddingHorizontal: theme.spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  loadingBlock: {
    paddingVertical: theme.spacing.xl,
    alignItems: "center",
    gap: theme.spacing.md,
  },
  loadingHint: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  errorBlock: {
    paddingVertical: theme.spacing.lg,
    alignItems: "stretch",
    gap: theme.spacing.md,
  },
  errorText: {
    fontSize: 15,
    color: theme.colors.dangerSolid,
    textAlign: "center",
  },
  bodyMuted: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textMuted,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  statusBlock: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  statusTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  statusChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  chipOn: {
    backgroundColor: theme.colors.semantic.successMuted,
  },
  chipOnText: {
    color: theme.colors.success,
  },
  chipOff: {
    backgroundColor: theme.colors.semantic.dangerMuted,
  },
  chipOffText: {
    color: theme.colors.dangerSolid,
  },
  chipPending: {
    backgroundColor: theme.colors.semantic.neutralMuted,
  },
  chipPendingText: {
    color: theme.colors.textMuted,
  },
});
