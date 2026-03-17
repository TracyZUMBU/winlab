import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AuthScreenLayout } from "../components/AuthScreenLayout";
import { AUTH_MESSAGES, AUTH_ROUTES } from "../constants/authConstants";
import { useAuthSession } from "../hooks/useAuthSession";
import { createProfile } from "../services";
import { usernameSchema, type UsernameFormValues } from "../validators";

const ACCENT = "#FF8C00";

export const CreateProfileScreen: React.FC = () => {
  const router = useRouter();
  const { user, status } = useAuthSession();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: "",
    },
  });

  const usernameField = register("username");
  const usernameValue = watch("username");

  const onSubmit = async (values: UsernameFormValues) => {
    setServerError(null);

    if (!user) {
      setServerError("Votre session a expiré. Merci de vous reconnecter.");
      router.replace(AUTH_ROUTES.email);
      return;
    }

    if (!user.email) {
      setServerError(
        "Impossible de récupérer votre email. Merci de vous reconnecter.",
      );
      router.replace(AUTH_ROUTES.email);
      return;
    }

    try {
      await createProfile({
        userId: user.id,
        email: user.email,
        username: values.username,
      });

      router.replace("/home");
    } catch (error: any) {
      setServerError(error?.message ?? AUTH_MESSAGES.genericError);
    }
  };

  const isLoadingSession = status === "loading";

  return (
    <AuthScreenLayout
      title="Choisissez votre pseudo"
      subtitle="Ce pseudo sera visible dans l’app Winlab."
    >
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>PSEUDO</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Votre pseudo"
          placeholderTextColor="#94A3B8"
          style={[
            styles.input,
            errors.username ? styles.inputError : undefined,
          ]}
          value={usernameValue}
          onChangeText={(text) => {
            setValue("username", text, { shouldValidate: true });
          }}
          onBlur={usernameField.onBlur}
        />
        {errors.username?.message ? (
          <Text style={styles.errorText}>{errors.username.message}</Text>
        ) : null}
      </View>

      {serverError ? (
        <Text style={styles.serverError}>{serverError}</Text>
      ) : null}

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
            (isSubmitting || isLoadingSession) && styles.primaryButtonDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting || isLoadingSession}
        >
          {isSubmitting || isLoadingSession ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Continuer</Text>
          )}
        </Pressable>
      </View>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.5,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#020617",
  },
  inputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: "#DC2626",
  },
  serverError: {
    marginTop: 12,
    fontSize: 14,
    color: "#DC2626",
  },
  footer: {
    marginTop: "auto",
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
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
