import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeaderFull } from "@/src/components/ui/AppHeaderFull";
import { theme } from "@/src/theme";

export type HomeHeaderBarProps = {
  appName: string;
  avatarUri: string | null;
  displayInitials: string;
  balanceLabel: string;
  onPressAvatar: () => void;
  onPressNotifications: () => void;
};

export function HomeHeaderBar({
  appName,
  avatarUri,
  displayInitials,
  balanceLabel,
  onPressAvatar,
  onPressNotifications,
}: HomeHeaderBarProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.stickyShell}>
      <AppHeaderFull
        title={appName}
        titleAlign="start"
        showBottomBorder
        leftSlot={
          <Pressable
            onPress={onPressAvatar}
            accessibilityRole="button"
            accessibilityLabel={t("home.header.a11y.openProfile")}
          >
            <View style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitials}>{displayInitials}</Text>
              )}
            </View>
          </Pressable>
        }
        rightSlot={
          <View style={styles.right}>
            <View style={styles.balancePill} accessibilityRole="text">
              <MaterialIcons name="token" size={16} color={theme.colors.text} />
              <Text style={styles.balanceText}>{balanceLabel}</Text>
            </View>
            <Pressable
              onPress={onPressNotifications}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={t("home.header.a11y.notifications")}
            >
              <MaterialIcons
                name="notifications-none"
                size={22}
                color={theme.colors.textMuted}
              />
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const AVATAR = 40;

const styles = StyleSheet.create({
  /** Fond opaque : l’en-tête reste lisible quand le contenu défile en dessous. */
  stickyShell: {
    backgroundColor: theme.colors.background,
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
