import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { useTranslation } from "react-i18next";
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

import {
  getLegalDocumentBody,
  type LegalDocumentId,
} from "@/src/legal/index";
import { theme } from "@/src/theme";

export type LegalScrollModalProps = {
  documentId: LegalDocumentId;
  onClose: () => void;
};

export function LegalScrollModal({ documentId, onClose }: LegalScrollModalProps) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  const title =
    documentId === "terms"
      ? t("emailScreen.termsOfService")
      : t("emailScreen.privacyPolicy");

  const body = getLegalDocumentBody(documentId, i18n.language);

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
            {title}
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
          <Text style={styles.body} selectable>
            {body}
          </Text>
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
  body: {
    ...theme.typography.cardBody,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
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
