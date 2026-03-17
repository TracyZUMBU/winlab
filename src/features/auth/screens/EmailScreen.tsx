import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { emailSchema, type EmailFormValues } from "../validators";
import { sendEmailOtp } from "../services";
import { AUTH_MESSAGES, AUTH_ROUTES } from "../constants/authConstants";
import { useTranslation } from "react-i18next";

const ACCENT = "#FF8C00";

export const EmailScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const emailField = register("email");
  const emailValue = watch("email");

  const onSubmit = async (values: EmailFormValues) => {
    setServerError(null);
    setInfoMessage(null);

    try {
      await sendEmailOtp({ email: values.email });
      setInfoMessage(AUTH_MESSAGES.emailSent);

      router.push({
        pathname: AUTH_ROUTES.otp,
        params: {
          email: values.email,
        },
      });
    } catch (error: any) {
      setServerError(error?.message ?? AUTH_MESSAGES.genericError);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <View style={styles.card}>
          {/* Top App Bar */}
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={8}
            >
              <MaterialIcons
                name="arrow-back-ios-new"
                size={24}
                color="#111813"
              />
            </Pressable>

            <View style={styles.tokenWrapper}>
              <View style={styles.tokenBackground}>
                <MaterialIcons name="token" size={22} color={ACCENT} />
              </View>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{t("emailScreen.title")}</Text>
              <Text style={styles.subtitle}>{t("emailScreen.subtitle")}</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>{t("emailScreen.label")}</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons
                    name="mail"
                    size={20}
                    color="#61896f"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    placeholder="name@example.com"
                    placeholderTextColor="#61896f"
                    style={[
                      styles.input,
                      errors.email ? styles.inputError : undefined,
                    ]}
                    value={emailValue}
                    onChangeText={(text) => {
                      setValue("email", text, { shouldValidate: true });
                    }}
                    onBlur={emailField.onBlur}
                  />
                </View>

                {errors.email?.message ? (
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                ) : null}
              </View>

              {serverError ? (
                <Text style={styles.serverError}>{serverError}</Text>
              ) : null}
              {infoMessage ? (
                <Text style={styles.info}>{infoMessage}</Text>
              ) : null}

              {/* Primary Action */}
              <View style={styles.primaryAction}>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.primaryButtonPressed,
                    isSubmitting && styles.primaryButtonDisabled,
                  ]}
                  onPress={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#111813" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {t("emailScreen.continue")}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.securityRow}>
                <MaterialIcons
                  name="lock"
                  size={14}
                  color="#61896f"
                  style={styles.lockIcon}
                />
                <Text style={styles.securityText}>
                  {t("emailScreen.secureAndEncryptedAuthentication")}
                </Text>
              </View>

              <Text style={styles.termsText}>
                By continuing, you agree to Winlab&apos;s{" "}
                <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>
            </View>
          </ScrollView>

          {/* Decorative background bubble */}
          <View style={styles.decorativeBubble} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E9F0EB",
  },
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  tokenWrapper: {
    flex: 1,
    alignItems: "center",
    paddingRight: 48,
  },
  tokenBackground: {
    backgroundColor: "rgba(255,140,0,0.16)",
    padding: 8,
    borderRadius: 12,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    flexGrow: 1,
  },
  header: {
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111813",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 22,
    color: "#61896f",
  },
  form: {
    marginTop: 8,
    gap: 16,
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
  inputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    marginTop: 4,
    fontSize: 13,
    color: "#DC2626",
  },
  serverError: {
    marginTop: 4,
    fontSize: 14,
    color: "#DC2626",
  },
  info: {
    marginTop: 4,
    fontSize: 14,
    color: "#16A34A",
  },
  primaryAction: {
    paddingTop: 16,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#111813",
    fontSize: 18,
    fontWeight: "700",
  },
  footer: {
    marginTop: "auto",
    alignItems: "center",
    paddingTop: 32,
    gap: 12,
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lockIcon: {
    marginTop: 1,
  },
  securityText: {
    fontSize: 13,
    color: "#61896f",
  },
  termsText: {
    fontSize: 11,
    lineHeight: 16,
    color: "#61896f",
    textAlign: "center",
    maxWidth: 280,
  },
  termsLink: {
    color: "#111813",
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  decorativeBubble: {
    position: "absolute",
    width: 256,
    height: 256,
    borderRadius: 999,
    backgroundColor: "rgba(255,140,0,0.1)",
    bottom: -96,
    right: -96,
  },
});
