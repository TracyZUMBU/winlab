import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { useTranslation } from "react-i18next";
import Markdown from "react-native-markdown-display";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/src/theme";

export type MissionRulesMarkdownModalProps = {
  markdown: string;
  onClose: () => void;
};

export function MissionRulesMarkdownModal({
  markdown,
  onClose,
}: MissionRulesMarkdownModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const markdownStyles = React.useMemo(
    () => ({
      body: {
        color: theme.colors.text,
        ...theme.typography.cardBody,
        fontSize: 15,
        lineHeight: 22,
      },
      heading1: {
        ...theme.typography.cardTitle,
        fontSize: 20,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.xs,
        color: theme.colors.text,
      },
      heading2: {
        ...theme.typography.cardTitle,
        fontSize: 18,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
        color: theme.colors.text,
      },
      heading3: {
        ...theme.typography.cardTitle,
        fontSize: 16,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
        color: theme.colors.text,
      },
      bullet_list: {
        marginVertical: theme.spacing.xs,
      },
      ordered_list: {
        marginVertical: theme.spacing.xs,
      },
      list_item: {
        marginVertical: 2,
        color: theme.colors.text,
        ...theme.typography.cardBody,
        fontSize: 15,
        lineHeight: 22,
      },
      paragraph: {
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
      },
      link: {
        color: theme.colors.accentSolid,
        textDecorationLine: "underline" as const,
      },
      code_inline: {
        backgroundColor: theme.colors.surfaceSoft,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        fontFamily: Platform.select({
          ios: "Menlo",
          android: "monospace",
          default: "monospace",
        }),
        fontSize: 14,
        color: theme.colors.text,
      },
      fence: {
        backgroundColor: theme.colors.surfaceSoft,
        padding: theme.spacing.sm,
        borderRadius: theme.radius.md,
        marginVertical: theme.spacing.xs,
        fontFamily: Platform.select({
          ios: "Menlo",
          android: "monospace",
          default: "monospace",
        }),
        fontSize: 13,
        color: theme.colors.text,
      },
    }),
    [],
  );

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.root,
          {
            paddingTop: insets.top + theme.spacing.sm,
            paddingBottom: insets.bottom + theme.spacing.sm,
          },
        ]}
        accessibilityViewIsModal
      >
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            {t("missions.detail.rulesModalTitle")}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            hitSlop={12}
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
          >
            <MaterialIcons name="close" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          <Markdown style={markdownStyles}>{markdown}</Markdown>
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.footerButton,
            pressed && styles.footerButtonPressed,
          ]}
        >
          <Text style={styles.footerButtonText}>{t("common.close")}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.cardTitle,
    flex: 1,
    fontSize: 17,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.radius.md,
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.lg,
  },
  footerButton: {
    marginTop: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSolid,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  footerButtonPressed: {
    opacity: 0.88,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.onAccent,
  },
});
