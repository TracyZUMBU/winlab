import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/theme";

export type OnboardingSlideProps = {
  title: string;
  description: string;
  illustration?: ReactNode;
};

export const OnboardingSlide = ({
  title,
  description,
  illustration,
}: OnboardingSlideProps) => {
  return (
    <View style={styles.container}>
      {illustration && <View style={styles.illustration}>{illustration}</View>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  illustration: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
});
