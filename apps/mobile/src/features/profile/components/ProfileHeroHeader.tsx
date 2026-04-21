import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/theme";
import { Image } from "expo-image";

export type ProfileHeroHeaderProps = {
  displayName: string;
  handleLabel: string;
  balanceLine: string;
  onPressEdit: () => void;
  editA11yLabel: string;
  onPressChangeAvatar: () => void;
  changeAvatarA11yLabel: string;
  avatarUri: string | null;
};

function initialsFromName(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}

export function ProfileHeroHeader({
  displayName,
  handleLabel,
  balanceLine,
  onPressEdit,
  editA11yLabel,
  onPressChangeAvatar,
  changeAvatarA11yLabel,
  avatarUri,
}: ProfileHeroHeaderProps) {
  const initials = initialsFromName(displayName);

  return (
    <View style={styles.wrap}>
      <View style={styles.avatarWrap}>
        <Pressable
          onPress={onPressChangeAvatar}
          accessibilityRole="button"
          accessibilityLabel={changeAvatarA11yLabel}
          style={({ pressed }) => [
            styles.avatar,
            pressed && styles.avatarPressed,
          ]}
        >
          {avatarUri ? (
            <Image
              key={avatarUri}
              cachePolicy="none"
              source={{ uri: avatarUri }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarInitials}>{initials}</Text>
          )}
        </Pressable>
        <Pressable
          onPress={onPressEdit}
          style={styles.editFab}
          accessibilityRole="button"
          accessibilityLabel={editA11yLabel}
        >
          <MaterialIcons name="edit" size={18} color={theme.colors.text} />
        </Pressable>
      </View>

      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.handle}>{handleLabel}</Text>

      <View style={styles.tokenPill}>
        <MaterialIcons
          name="stars"
          size={22}
          color={theme.colors.accentSolid}
        />
        <Text style={styles.tokenText}>{balanceLine}</Text>
      </View>
    </View>
  );
}

const AVATAR = 128;

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg + 2,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  avatarWrap: {
    width: AVATAR,
    height: AVATAR,
    marginBottom: theme.spacing.xs,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 4,
    borderColor: theme.colors.accentBorderMuted,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarPressed: {
    opacity: 0.92,
  },
  avatarImage: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: "700",
    color: theme.colors.textMutedAccent,
  },
  editFab: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accentSolid,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: theme.colors.background,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
    color: theme.colors.text,
    textAlign: "center",
  },
  handle: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.textMutedAccent,
    textAlign: "center",
  },
  tokenPill: {
    marginTop: theme.spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accentWash,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    maxWidth: "100%",
  },
  tokenText: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.text,
  },
});
