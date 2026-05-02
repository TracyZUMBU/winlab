import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, StyleSheet, Text } from "react-native";

import { theme } from "@/src/theme";
import { showErrorToast } from "@/src/shared/toast";

export type MissionExternalActionButtonProps = {
  url: string;
  label: string;
  platform: string;
  onOpened: () => void;
  disabled?: boolean;
};

type MciName = keyof typeof MaterialCommunityIcons.glyphMap;

function platformIconName(platform: string): MciName {
  const p = platform.trim().toLowerCase();
  if (p === "instagram") return "instagram";
  if (p === "tiktok") return "music-note-eighth" as MciName;
  if (p === "youtube") return "youtube";
  if (p === "website") return "web";
  return "open-in-new";
}

export function MissionExternalActionButton({
  url,
  label,
  platform,
  onOpened,
  disabled,
}: MissionExternalActionButtonProps) {
  const { t } = useTranslation();
  const iconName = platformIconName(platform);

  const handlePress = async () => {
    if (disabled) return;
    try {
      await Linking.openURL(url);
      onOpened();
    } catch {
      showErrorToast({
        title: t("missions.detail.externalAction.linkOpenError"),
      });
    }
  };

  return (
    <Pressable
      onPress={() => void handlePress()}
      disabled={disabled}
      style={({ pressed }) => [
        styles.root,
        disabled && styles.rootDisabled,
        pressed && !disabled && styles.rootPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <MaterialCommunityIcons
        name={iconName}
        size={22}
        color={disabled ? theme.colors.textMuted : theme.colors.onAccent}
      />
      <Text
        style={[styles.label, disabled && styles.labelDisabled]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSolid,
  },
  rootDisabled: {
    backgroundColor: theme.colors.borderSubtle,
  },
  rootPressed: {
    opacity: 0.92,
  },
  label: {
    flex: 1,
    ...theme.typography.cardBody,
    fontWeight: "600",
    color: theme.colors.onAccent,
  },
  labelDisabled: {
    color: theme.colors.textMuted,
  },
});
