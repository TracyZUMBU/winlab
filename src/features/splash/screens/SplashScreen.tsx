import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/src/components/ui/Screen";
import { getCurrentSession } from "@/src/lib/supabase/session";
import { theme } from "@/src/theme";

const SPLASH_DELAY_MS = 1800;

export function SplashScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: SPLASH_DELAY_MS,
      useNativeDriver: false,
    }).start();

    const timeoutId = setTimeout(() => {
      const checkSessionAndNavigate = async () => {
        try {
          const { user } = await getCurrentSession();
          console.log("user", user);
          if (user) {
            router.replace("/home");
          } else {
            router.replace("/(auth)/email");
          }
        } catch {
          router.replace("/onboarding");
        }
      };

      void checkSessionAndNavigate();
    }, SPLASH_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [router, progress]);

  return (
    <Screen>
      <LinearGradient
        colors={["#FFFFFF", "rgba(255, 140, 0, 0.04)"]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              {/* TODO:Placeholder icon using a simple shape; replace with real logo when ready */}
              <View style={styles.logoGlyph} />
            </View>
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
              {t("splash.version", { version: "1.0.0" })}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Screen>
  );
}

const PROGRESS_HEIGHT = 4;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
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
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
    marginBottom: theme.spacing.lg,
  },
  logoGlyph: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accentSolid,
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
