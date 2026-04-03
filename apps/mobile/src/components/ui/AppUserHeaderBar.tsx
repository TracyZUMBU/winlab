import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useMyProfileQuery } from "@/src/features/profile/hooks/useMyProfileQuery";
import { useWalletBalanceQuery } from "@/src/features/wallet/hooks/useWalletBalanceQuery";
import { trackEvent } from "@/src/lib/analytics/trackEvent";
import { initialsFromUsername } from "@/src/lib/display/initialsFromUsername";
import { theme } from "@/src/theme";

import { AppHeaderFull } from "./AppHeaderFull";

export type AppUserHeaderBarProps = {
  /** @default true */
  showNotifications?: boolean;
};

export function AppUserHeaderBar({
  showNotifications = true,
}: AppUserHeaderBarProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const locale = i18n.language.startsWith("fr") ? "fr-FR" : "en-US";

  const { data: profile, isLoading: profileLoading } = useMyProfileQuery();
  const { data: wallet, isLoading: walletLoading } = useWalletBalanceQuery();

  const balanceLabel = useMemo(() => {
    if (walletLoading && wallet == null) return "…";
    if (wallet == null) return "0";
    return new Intl.NumberFormat(locale).format(wallet.balance);
  }, [locale, wallet, walletLoading]);

  const avatarUri = profile?.avatar_url ?? null;
  const displayInitials = initialsFromUsername(profile?.username ?? null);
  const a11yBalanceAmount =
    walletLoading && wallet == null ? t("common.loading") : balanceLabel;

  const onOpenProfile = () => {
    trackEvent("header_open_profile");
    router.push("/profile");
  };

  const onOpenNotifications = () => {
    trackEvent("header_open_notifications");
    router.push("/profile");
  };

  return (
    <View style={styles.stickyShell}>
      <AppHeaderFull
        title={t("app.name")}
        titleAlign="start"
        showBottomBorder
        leftSlot={
          <Pressable
            onPress={onOpenProfile}
            accessibilityRole="button"
            accessibilityLabel={t("common.a11y.openProfile")}
          >
            <View style={styles.avatar}>
              {profileLoading && !avatarUri ? (
                <Text style={styles.avatarInitials}>…</Text>
              ) : avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitials}>{displayInitials}</Text>
              )}
            </View>
          </Pressable>
        }
        rightSlot={
          <View style={styles.right}>
            <View
              style={styles.balancePill}
              accessibilityRole="text"
              accessibilityLabel={t("common.a11y.tokenBalance", {
                amount: a11yBalanceAmount,
              })}
            >
              <MaterialIcons
                name="token"
                size={16}
                color={theme.colors.accentSolid}
              />
              <Text style={styles.balanceText}>{balanceLabel}</Text>
            </View>
            {showNotifications ? (
              <Pressable
                onPress={onOpenNotifications}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel={t("common.a11y.notifications")}
              >
                <MaterialIcons
                  name="notifications"
                  size={22}
                  color={theme.colors.textMuted}
                />
              </Pressable>
            ) : null}
          </View>
        }
      />
    </View>
  );
}

const AVATAR = 40;

const styles = StyleSheet.create({
  stickyShell: {
    backgroundColor: theme.colors.backgroundHeader,
    paddingHorizontal: theme.spacing.screenHorizontal,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: theme.colors.surfaceSoft,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  avatarImg: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.textMutedAccent,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flexShrink: 0,
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
  },
  balanceText: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.text,
  },
  iconButton: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.pill,
  },
});
