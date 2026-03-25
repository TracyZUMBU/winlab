import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/theme";

export type SectionHeaderProps = {
  title: string;
  subtitle?: string;
};

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  subtitle: {
    color: theme.colors.textMutedAccent,
    ...theme.typography.cardBody,
  },
});
