import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useMyProfileQuery } from "@/src/features/profile/hooks/useMyProfileQuery";
import { resolveAvatarDisplayUri } from "@/src/features/profile/services/avatarStorage";
import { trackEvent } from "@/src/lib/analytics/trackEvent";
import { initialsFromUsername } from "@/src/lib/display/initialsFromUsername";
import { theme } from "@/src/theme";

import { AppHeader } from "./AppHeader";
import { TokenBalancePill } from "./TokenBalancePill";

export type AppUserHeaderBarProps = {
  /** @default false */
  showNotifications?: boolean;
  /** Token icon in the balance pill; defaults to brand yellow. */
  tokenIconColor?: string;
};

export function AppUserHeaderBar({
  showNotifications = false,
  tokenIconColor = theme.colors.home.tokenIcon,
}: AppUserHeaderBarProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: profile, isLoading: profileLoading } = useMyProfileQuery();

  const avatarUri = useMemo(
    () =>
      resolveAvatarDisplayUri(profile?.avatar_url, profile?.updated_at ?? null),
    [profile?.avatar_url, profile?.updated_at],
  );
  const displayInitials = initialsFromUsername(profile?.username ?? null);

  const onOpenProfile = () => {
    trackEvent("header_open_profile");
    router.push("/profile");
  };

  const onOpenNotifications = () => {
    trackEvent("header_open_notifications");
    // TODO: implement notifications panel
  };

  return (
    <View style={styles.stickyShell}>
      <AppHeader
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
                <Text style={styles.avatarInitials}>
                  {t("common.loading_ellipsis")}
                </Text>
              ) : avatarUri ? (
                <Image
                  key={avatarUri}
                  cachePolicy="none"
                  source={{ uri: avatarUri }}
                  style={styles.avatarImg}
                />
              ) : (
                <Text style={styles.avatarInitials}>{displayInitials}</Text>
              )}
            </View>
          </Pressable>
        }
        rightSlot={
          <View style={styles.right}>
            <TokenBalancePill tokenIconColor={tokenIconColor} />
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
  iconButton: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.pill,
  },
});
