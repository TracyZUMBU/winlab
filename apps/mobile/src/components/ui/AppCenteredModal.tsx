import { useTranslation } from "react-i18next";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { theme } from "@/src/theme";

import { Button } from "./Button";
import { Card } from "./Card";

export type AppCenteredModalProps = {
  visible: boolean;
  onDismiss: () => void;
  /** Primary heading (required). */
  title: string;
  /** Optional secondary line below the title. */
  message?: string;
  /** Primary button label; defaults to `common.ok`. */
  primaryActionLabel?: string;
  /** When true, tapping the dimmed backdrop calls `onDismiss`. Default true. */
  dismissOnBackdropPress?: boolean;
  testID?: string;
};

/**
 * Full-screen `Modal` with a centered card — renders above the rest of the app chrome.
 * Hardware back (Android) always invokes `onDismiss` via `onRequestClose`.
 */
export function AppCenteredModal({
  visible,
  onDismiss,
  title,
  message,
  primaryActionLabel,
  dismissOnBackdropPress = true,
  testID,
}: AppCenteredModalProps) {
  const { t } = useTranslation();
  const okLabel = primaryActionLabel ?? t("common.ok");
  const hasMessage = Boolean(message?.trim());

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onDismiss}
      statusBarTranslucent={Platform.OS === "android"}
    >
      <View style={styles.root} testID={testID}>
        <Pressable
          accessibilityRole={dismissOnBackdropPress ? "button" : undefined}
          accessibilityLabel={
            dismissOnBackdropPress ? t("common.close") : undefined
          }
          accessibilityElementsHidden={!dismissOnBackdropPress}
          importantForAccessibility={
            dismissOnBackdropPress ? "yes" : "no-hide-descendants"
          }
          style={[styles.backdrop, StyleSheet.absoluteFillObject]}
          onPress={dismissOnBackdropPress ? onDismiss : undefined}
        />
        <View
          pointerEvents="box-none"
          style={[styles.foreground, StyleSheet.absoluteFillObject]}
        >
          <View
            style={styles.cardWrap}
            {...(Platform.OS === "ios"
              ? { accessibilityViewIsModal: true }
              : {})}
            accessibilityRole="alert"
          >
            <Card variant="elevated" style={styles.card}>
              <Text style={styles.title} accessibilityRole="header">
                {title}
              </Text>
              {hasMessage ? (
                <Text style={styles.message}>{message}</Text>
              ) : null}
              <Button
                title={okLabel}
                onPress={onDismiss}
                fullWidth
                style={styles.button}
              />
            </Card>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  foreground: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  cardWrap: {
    width: "100%",
    maxWidth: 360,
  },
  card: {
    gap: theme.spacing.md,
  },
  title: {
    ...theme.typography.cardTitle,
    fontSize: 18,
    color: theme.colors.text,
    textAlign: "center",
  },
  message: {
    ...theme.typography.cardBody,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  button: {
    marginTop: theme.spacing.xs,
  },
});
