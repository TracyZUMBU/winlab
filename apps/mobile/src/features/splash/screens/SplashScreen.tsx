import Constants from "expo-constants";
import * as ExpoSplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Image, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/src/components/ui/Screen";
import { SPLASH_MIN_VISIBLE_MS } from "@/src/features/splash/constants";
import { theme } from "@/src/theme";

let hasHiddenNativeSplash = false;

function hideNativeSplash() {
  if (hasHiddenNativeSplash) return;
  hasHiddenNativeSplash = true;
  void ExpoSplashScreen.hideAsync().catch(() => {
    // Already hidden (fast refresh, tests).
  });
}

export function SplashScreen() {
  const { t } = useTranslation();
  const appVersion = Constants.expoConfig?.version ?? "—";
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: SPLASH_MIN_VISIBLE_MS,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <Screen style={styles.screen}>
      <View style={styles.content} onLayout={hideNativeSplash}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <Text style={styles.appName}>{t("app.name")}</Text>
          <Text style={styles.baseline}>{t("splash.baseline")}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.statusLabel}>
            {t("splash.status_initializing")}
          </Text>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.metaText}>
            {t("splash.version", { version: appVersion })}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const PROGRESS_HEIGHT = 4;
const LOGO_SIZE = 96;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    justifyContent: "space-between",
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: 0.2,
  },
  baseline: {
    marginTop: theme.spacing.sm,
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  footer: {
    gap: theme.spacing.sm,
  },
  statusLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  progressTrack: {
    height: PROGRESS_HEIGHT,
    borderRadius: PROGRESS_HEIGHT / 2,
    backgroundColor: "rgba(15, 23, 42, 0.06)",
    overflow: "hidden",
  },
  progressFill: {
    width: "75%",
    height: "100%",
    borderRadius: PROGRESS_HEIGHT / 2,
    backgroundColor: theme.colors.accentSolid,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});
