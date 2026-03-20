import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { PaginationDots } from "@/src/components/ui/PaginationDots";
import { Screen } from "@/src/components/ui/Screen";
import { theme } from "@/src/theme";

import { setHasSeenOnboardingTrue } from "@/src/lib/onboardingStorage";
import { useRouter } from "expo-router";
import { AUTH_ROUTES } from "../../auth/constants/authConstants";
import { ONBOARDING_SLIDES } from "../constants";

export function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const currentSlide = ONBOARDING_SLIDES[activeIndex];
  const { t } = useTranslation();

  // No reading here to keep the screen simple:
  // the write is triggered only when the user marks the end.

  const handleNext = async () => {
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      setActiveIndex((index) => index + 1);
    } else {
      try {
        await setHasSeenOnboardingTrue();
      } catch (error: unknown) {
        // don't block the user if the write fails (app still works).
        console.warn("Failed to persist onboarding state:", error);
      }
      router.replace(AUTH_ROUTES.email);
    }
  };

  const handleSkip = async () => {
    await setHasSeenOnboardingTrue();
    router.replace(AUTH_ROUTES.email);
  };

  const handleNavigate = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.brand}>{t("onboarding.brand")}</Text>
        <Button
          title={t("onboarding.skip")}
          variant="ghost"
          onPress={handleSkip}
          style={styles.skipButton}
          textStyle={styles.skipText}
        />
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <View style={styles.illustrationPlaceholder}>
            <View style={styles.illustrationBadge}>
              <View style={styles.illustrationCheck} />
            </View>
            <View style={styles.illustrationLines}>
              <View
                style={[
                  styles.illustrationLine,
                  styles.illustrationLinePrimary,
                ]}
              />
              <View
                style={[styles.illustrationLine, styles.illustrationLineMuted]}
              />
              <View
                style={[styles.illustrationLine, styles.illustrationLineMuted]}
              />
            </View>
          </View>
        </Card>

        <View style={styles.textBlock}>
          <Text style={styles.title}>
            {t(`onboarding.slides.${currentSlide.id}.title`)}
          </Text>
          <Text style={styles.description}>
            {t(`onboarding.slides.${currentSlide.id}.description`)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <PaginationDots
          total={ONBOARDING_SLIDES.length}
          activeIndex={activeIndex}
          onPress={handleNavigate}
        />

        <Button
          title={
            activeIndex < ONBOARDING_SLIDES.length - 1
              ? t("onboarding.next")
              : t("onboarding.go")
          }
          onPress={handleNext}
          style={styles.primaryCta}
        />

        <Text style={styles.stepText}>
          {t("onboarding.step", {
            current: activeIndex + 1,
            total: ONBOARDING_SLIDES.length,
          })}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xl,
  },
  brand: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  skipButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    elevation: 0,
    shadowOpacity: 0,
  },
  skipText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  content: {
    flex: 1,
  },
  card: {
    marginBottom: theme.spacing.xl,
  },
  illustrationPlaceholder: {
    height: 220,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  illustrationBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ECFEFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
  },
  illustrationCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accentSolid,
  },
  illustrationLines: {
    width: "100%",
    gap: theme.spacing.sm,
  },
  illustrationLine: {
    height: 10,
    borderRadius: 999,
  },
  illustrationLinePrimary: {
    width: "80%",
    backgroundColor: "rgba(15, 23, 42, 0.12)",
  },
  illustrationLineMuted: {
    width: "60%",
    backgroundColor: "rgba(15, 23, 42, 0.06)",
  },
  textBlock: {
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textMuted,
  },
  footer: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  primaryCta: {
    width: "100%",
  },
  stepText: {
    fontSize: 13,
    textAlign: "center",
    color: theme.colors.textMuted,
  },
});
