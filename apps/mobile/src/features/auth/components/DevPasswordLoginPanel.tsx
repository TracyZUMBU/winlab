import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { signInWithEmailPassword } from "../services";
import { redirectAfterAuthSession } from "../utils/redirectAfterAuthSession";
import { devPasswordLoginSchema, emailSchema } from "../validators";
import { AUTH_MESSAGES } from "../constants/authConstants";

export type DevPasswordLoginPanelProps = {
  /** Valeur courante du champ email sur EmailScreen (même flux que l’OTP). */
  email: string;
};

/**
 * Connexion email + mot de passe réservée au développement (__DEV__).
 * Ne pas monter hors de `__DEV__` depuis l’écran parent.
 */
export const DevPasswordLoginPanel: React.FC<DevPasswordLoginPanelProps> = ({
  email,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);

    const emailParsed = emailSchema.safeParse({ email });
    if (!emailParsed.success) {
      const msg = emailParsed.error.flatten().fieldErrors.email?.[0];
      setError(msg ?? t("emailScreen.error.email"));
      return;
    }

    const pwdParsed = devPasswordLoginSchema.safeParse({ password });
    if (!pwdParsed.success) {
      const msg = pwdParsed.error.flatten().fieldErrors.password?.[0];
      setError(msg ?? AUTH_MESSAGES.genericError);
      return;
    }

    setSubmitting(true);
    try {
      const user = await signInWithEmailPassword({
        email: emailParsed.data.email,
        password: pwdParsed.data.password,
      });
      await redirectAfterAuthSession(router, user.id);
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{t("emailScreen.dev.title")}</Text>
      <Text style={styles.panelSubtitle}>{t("emailScreen.dev.subtitle")}</Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{t("emailScreen.dev.passwordLabel")}</Text>
        <View style={styles.inputWrapper}>
          <MaterialIcons
            name="lock"
            size={20}
            color="#61896f"
            style={styles.inputIcon}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="••••••••"
            placeholderTextColor="#61896f"
            secureTextEntry
            textContentType="password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
        </View>
      </View>

      {error ? <Text style={styles.serverError}>{error}</Text> : null}

      <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          pressed && styles.submitButtonPressed,
          submitting && styles.submitButtonDisabled,
        ]}
        onPress={onSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#111813" />
        ) : (
          <Text style={styles.submitButtonText}>
            {t("emailScreen.dev.submit")}
          </Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 140, 0, 0.45)",
    backgroundColor: "rgba(255, 140, 0, 0.06)",
    gap: 12,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400e",
    letterSpacing: 0.3,
  },
  panelSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: "#a16207",
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    letterSpacing: 1.1,
    fontWeight: "600",
    color: "#111813",
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    zIndex: 1,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dbe6df",
    paddingLeft: 48,
    paddingRight: 16,
    height: 64,
    fontSize: 18,
    backgroundColor: "#FFFFFF",
    color: "#111813",
  },
  serverError: {
    marginTop: 4,
    fontSize: 14,
    color: "#DC2626",
  },
  submitButton: {
    marginTop: 4,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fcd34d",
    borderWidth: 1,
    borderColor: "rgba(146, 64, 14, 0.25)",
  },
  submitButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#111813",
    fontSize: 16,
    fontWeight: "700",
  },
});
