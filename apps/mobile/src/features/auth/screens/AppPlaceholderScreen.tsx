import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AUTH_ROUTES } from "../constants/authConstants";
import { useAuthSession } from "../hooks/useAuthSession";
import { useSignOutMutation } from "../hooks/useSignOutMutation";

const ACCENT = "#FF8C00";

export const AppPlaceholderScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthSession();
  const signOutMutation = useSignOutMutation();

  const { t } = useTranslation();

  const handleLogout = () => {
    signOutMutation.mutate(undefined, {
      onSuccess: () => {
        router.replace(AUTH_ROUTES.email);
      },
      onError: () => {
        // Show error feedback (e.g., toast or alert)
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("appPlaceholder.title")}</Text>
      {user?.email ? <Text style={styles.subtitle}>{user.email}</Text> : null}
      <Text style={styles.caption}>{t("appPlaceholder.caption")}</Text>

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.primaryButtonPressed,
          signOutMutation.isPending && styles.primaryButtonDisabled,
        ]}
        onPress={handleLogout}
        disabled={signOutMutation.isPending}
      >
        {signOutMutation.isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>
            {t("appPlaceholder.logout")}
          </Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#020617",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: "#64748B",
  },
  caption: {
    marginTop: 16,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 32,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: ACCENT,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
