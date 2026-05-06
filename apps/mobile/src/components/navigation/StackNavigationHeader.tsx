import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { useRouter } from "expo-router";
import { type ReactNode, isValidElement } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/src/theme";

function renderHeaderTitle(
  headerProps: NativeStackHeaderProps,
  tintColor: string,
): ReactNode {
  const { options, route } = headerProps;
  const fallbackTitle = options.title ?? route.name;

  if (typeof options.headerTitle === "function") {
    return options.headerTitle({ children: fallbackTitle, tintColor });
  }

  if (isValidElement(options.headerTitle)) {
    return options.headerTitle;
  }

  const titleColor = tintColor ?? theme.colors.text;

  if (typeof options.headerTitle === "string") {
    return (
      <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
        {options.headerTitle}
      </Text>
    );
  }

  return (
    <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
      {fallbackTitle}
    </Text>
  );
}

export type StackNavigationHeaderProps = NativeStackHeaderProps & {
  /** Bottom hairline (default true). */
  showBottomBorder?: boolean;
  /** Override left slot. */
  leftSlot?: ReactNode;
  /** Override right slot. */
  rightSlot?: ReactNode;
};

export function StackNavigationHeader({
  navigation,
  back,
  options,
  showBottomBorder = true,
  leftSlot,
  rightSlot,
  ...headerProps
}: StackNavigationHeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const o = options as { tintColor?: string; headerTintColor?: string };
  const tintColor =
    (typeof o.tintColor === "string" ? o.tintColor : undefined) ??
    (typeof o.headerTintColor === "string" ? o.headerTintColor : undefined) ??
    theme.colors.text;

  // Prefer Expo Router history (global) over native stack history (local).
  const canGoBack = router.canGoBack() || Boolean(back);
  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    navigation.goBack();
  };

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + theme.spacing.sm },
        showBottomBorder && styles.rootBordered,
      ]}
    >
      <View style={styles.side}>
        {leftSlot ? (
          leftSlot
        ) : canGoBack ? (
          <Pressable
            onPress={handleBackPress}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t("common.a11y.back")}
          >
            <MaterialIcons name="chevron-left" size={28} color={tintColor} />
          </Pressable>
        ) : (
          <View style={styles.sideSpacer} />
        )}
      </View>

      <View style={styles.titleShell}>
        {renderHeaderTitle(
          {
            navigation,
            back,
            options,
            ...headerProps,
          } as NativeStackHeaderProps,
          tintColor,
        )}
      </View>

      <View style={styles.side}>
        {rightSlot ?? <View style={styles.sideSpacer} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: theme.layout.headerContentMinHeight,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.screenHorizontal,
    backgroundColor: theme.colors.backgroundHeader,
  },
  rootBordered: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
  },
  side: {
    minWidth: theme.layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  sideSpacer: {
    width: theme.layout.minTouchTarget,
  },
  backButton: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.pill,
  },
  titleShell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    minWidth: 0,
    textAlign: "center",
    color: theme.colors.text,
    ...theme.typography.screenTitle,
  },
});
