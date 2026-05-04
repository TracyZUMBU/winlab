import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { LegalDocumentId } from "@/src/legal/index";
import { theme } from "@/src/theme";

export type ProfileLegalDocumentsMenuModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (id: LegalDocumentId) => void;
};

export function ProfileLegalDocumentsMenuModal({
  visible,
  onClose,
  onSelect,
}: ProfileLegalDocumentsMenuModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const rows: {
    id: LegalDocumentId;
    labelKey: string;
    icon: "article" | "policy" | "emoji-events";
  }[] = [
    { id: "terms", labelKey: "emailScreen.termsOfService", icon: "article" },
    { id: "privacy", labelKey: "emailScreen.privacyPolicy", icon: "policy" },
    {
      id: "lotteryRules",
      labelKey: "legalDocuments.lotteryRulesTitle",
      icon: "emoji-events",
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === "android"}
    >
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            {
              marginBottom: insets.bottom + theme.spacing.md,
              marginHorizontal: theme.spacing.md,
            },
          ]}
          accessibilityViewIsModal
        >
          <Text style={styles.sheetTitle} accessibilityRole="header">
            {t("profile.menu.legalDocumentsSheetTitle")}
          </Text>
          {rows.map((row, index) => (
            <Pressable
              key={row.id}
              accessibilityRole="button"
              accessibilityLabel={t(row.labelKey)}
              onPress={() => onSelect(row.id)}
              style={({ pressed }) => [
                styles.row,
                index > 0 && styles.rowBorder,
                pressed && styles.rowPressed,
              ]}
            >
              <MaterialIcons
                name={row.icon}
                size={22}
                color={theme.colors.textMuted}
              />
              <Text style={styles.rowLabel}>{t(row.labelKey)}</Text>
              <MaterialIcons
                name="chevron-right"
                size={22}
                color={theme.colors.textMuted}
              />
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancelRow,
              pressed && styles.rowPressed,
            ]}
          >
            <Text style={styles.cancelLabel}>{t("common.close")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.sm,
    maxWidth: 440,
    alignSelf: "center",
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
    }),
  },
  sheetTitle: {
    ...theme.typography.cardTitle,
    fontSize: 17,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.borderSubtle,
  },
  rowPressed: {
    backgroundColor: theme.colors.surfaceSoft,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  cancelRow: {
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.accentSolid,
  },
});
