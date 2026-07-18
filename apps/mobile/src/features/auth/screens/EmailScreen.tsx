import type { LegalDocumentId } from "@/src/legal/index";
import { getI18nMessageForCode } from "@/src/lib/i18n/errorCodeMessage";
import { monitoring } from "@/src/lib/monitoring";
import { colors } from "@/src/theme/colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LegalScrollModal } from "../components/LegalScrollModal";
import { AUTH_ROUTES } from "../constants/authConstants";
import { sendEmailOtp, signInWithEmailPassword } from "../services";
import { isPasswordLoginEmail } from "../utils/passwordLoginEmails";
import { redirectAfterAuthSession } from "../utils/redirectAfterAuthSession";
import {
  emailSchema,
  passwordLoginSchema,
  type EmailFormValues,
} from "../validators";

function createAuthRequestId(): string {
  return `auth-email-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const EmailScreen: React.FC = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocumentId | null>(
    null,
  );

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
  const usePasswordLogin = isPasswordLoginEmail(emailValue ?? "");
  const isBusy = isSubmitting || passwordSubmitting;

  const onSubmitOtp = async (values: EmailFormValues) => {
    setServerError(null);
    setInfoMessage(null);
    const requestId = createAuthRequestId();
    monitoring.captureMessage({
      name: "auth_email_continue_submit_started",
      severity: "info",
      feature: "auth",
      requestId,
      message: "EmailScreen submit started",
      extra: {
        platform: Platform.OS,
      },
    });

    const result = await sendEmailOtp({ email: values.email, requestId });

    if (result.success) {
      setInfoMessage(t("auth.emailSent"));
      monitoring.captureMessage({
        name: "auth_email_continue_submit_success",
        severity: "info",
        feature: "auth",
        requestId,
        message: "EmailScreen submit succeeded",
        extra: {
          platform: Platform.OS,
        },
      });

      try {
        router.push({
          pathname: AUTH_ROUTES.otp,
          params: {
            email: values.email,
            requestId,
          },
        });
      } catch (error) {
        monitoring.captureException({
          name: "auth_email_continue_navigation_failed",
          severity: "error",
          feature: "auth",
          requestId,
          message: "EmailScreen failed to navigate to OTP screen",
          error,
          extra: {
            platform: Platform.OS,
          },
        });
      }
      return;
    }

    const failureExtra: Record<string, string> = {
      platform: Platform.OS,
      failureKind: result.kind,
      branch: result.diagnostic.branch,
      connectivityProbe: result.diagnostic.connectivityProbe,
      supabaseConfigured: result.diagnostic.supabaseConfigured,
      errorIsInstanceOfError: result.diagnostic.errorIsInstanceOfError,
      ...(result.diagnostic.supabaseUrlHost
        ? { supabaseUrlHost: result.diagnostic.supabaseUrlHost }
        : {}),
      ...(result.diagnostic.connectivityHttpStatus
        ? { connectivityHttpStatus: result.diagnostic.connectivityHttpStatus }
        : {}),
      ...(result.diagnostic.connectivityErrorMessage
        ? {
            connectivityErrorMessage:
              result.diagnostic.connectivityErrorMessage,
          }
        : {}),
      ...(result.diagnostic.supabaseErrorCode
        ? { supabaseErrorCode: result.diagnostic.supabaseErrorCode }
        : {}),
      ...(result.diagnostic.errorName
        ? { errorName: result.diagnostic.errorName }
        : {}),
      ...(result.diagnostic.errorMessage
        ? { errorMessage: result.diagnostic.errorMessage }
        : {}),
      ...(result.kind === "business" ? { errorCode: result.errorCode } : {}),
    };

    if (result.kind === "business") {
      monitoring.captureMessage({
        name: "auth_email_continue_submit_failed",
        severity: "warning",
        feature: "auth",
        requestId,
        message: "EmailScreen submit failed",
        extra: failureExtra,
      });
    } else {
      monitoring.captureException({
        name: "auth_email_continue_submit_failed",
        severity: "error",
        feature: "auth",
        requestId,
        message: "EmailScreen submit failed",
        error: new Error(
          result.diagnostic.errorMessage ??
            `sendEmailOtp_${result.kind}_${result.diagnostic.branch}`,
        ),
        extra: failureExtra,
      });
    }

    setServerError(
      result.kind === "business"
        ? getI18nMessageForCode({
            t,
            i18n,
            baseKey: "auth.email.errors",
            code: result.errorCode,
            fallbackKey: "auth.email.errors.generic",
          })
        : t("auth.email.errors.generic"),
    );
  };

  const onInvalidSubmit = (formErrors: FieldErrors<EmailFormValues>) => {
    const hasEmailError = Boolean(formErrors.email);
    monitoring.captureMessage({
      name: "auth_email_continue_validation_failed",
      severity: "warning",
      feature: "auth",
      message: "EmailScreen submit blocked by validation",
      extra: {
        platform: Platform.OS,
        hasEmailError: String(hasEmailError),
      },
    });
  };

  const onPressPasswordSignIn = async () => {
    setServerError(null);
    setInfoMessage(null);
    setPasswordError(null);

    const emailParsed = emailSchema.safeParse({ email: emailValue });
    if (!emailParsed.success) {
      const msg = emailParsed.error.flatten().fieldErrors.email?.[0];
      setServerError(msg ?? t("emailScreen.error.email"));
      return;
    }

    if (!isPasswordLoginEmail(emailParsed.data.email)) {
      return;
    }

    const pwdParsed = passwordLoginSchema.safeParse({ password });
    if (!pwdParsed.success) {
      const msg = pwdParsed.error.flatten().fieldErrors.password?.[0];
      setPasswordError(
        msg ?? t("emailScreen.passwordLogin.error.passwordRequired"),
      );
      return;
    }

    setPasswordSubmitting(true);
    monitoring.captureMessage({
      name: "auth_password_login_submit_started",
      severity: "info",
      feature: "auth",
      message: "EmailScreen password login started",
      extra: { platform: Platform.OS },
    });

    try {
      const user = await signInWithEmailPassword({
        email: emailParsed.data.email,
        password: pwdParsed.data.password,
      });
      monitoring.captureMessage({
        name: "auth_password_login_submit_success",
        severity: "info",
        feature: "auth",
        message: "EmailScreen password login succeeded",
        extra: { platform: Platform.OS },
      });
      try {
        await redirectAfterAuthSession(router, user.id);
      } catch (error) {
        monitoring.captureException({
          name: "auth_password_login_redirect_after_auth_failed",
          severity: "error",
          feature: "auth",
          message: "EmailScreen failed to redirect after password login",
          error,
          extra: { platform: Platform.OS },
        });
        setServerError(t("auth.genericError"));
      }
    } catch {
      monitoring.captureMessage({
        name: "auth_password_login_submit_failed",
        severity: "warning",
        feature: "auth",
        message: "EmailScreen password login failed",
        extra: { platform: Platform.OS },
      });
      setServerError(t("auth.genericError"));
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const onPressPrimary = () => {
    if (usePasswordLogin) {
      void onPressPasswordSignIn();
      return;
    }

    monitoring.captureMessage({
      name: "auth_email_continue_button_pressed",
      severity: "info",
      feature: "auth",
      message: "EmailScreen continue button pressed",
      extra: {
        platform: Platform.OS,
        isSubmitting: String(isSubmitting),
      },
    });

    void handleSubmit(onSubmitOtp, onInvalidSubmit)();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.root}>
          <View style={styles.card}>
            <View style={styles.topBar}>
              <View style={styles.tokenWrapper}>
                <View style={styles.tokenBackground}>
                  <MaterialIcons
                    name="token"
                    size={22}
                    color={colors.accentSolid}
                  />
                </View>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              automaticallyAdjustKeyboardInsets
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <Text style={styles.title}>{t("emailScreen.title")}</Text>
                <Text style={styles.subtitle}>{t("emailScreen.subtitle")}</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>{t("emailScreen.label")}</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons
                      name="mail"
                      size={20}
                      color={colors.textMutedAccent}
                      style={styles.inputIcon}
                    />

                    <TextInput
                      autoCapitalize="none"
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      autoComplete="email"
                      placeholder={t("emailScreen.emailPlaceholder")}
                      placeholderTextColor={colors.textMutedAccent}
                      style={[
                        styles.input,
                        errors.email ? styles.inputError : undefined,
                      ]}
                      value={emailValue}
                      onChangeText={(text) => {
                        setValue("email", text, { shouldValidate: true });
                        setPassword("");
                        setPasswordError(null);
                        setServerError(null);
                        setInfoMessage(null);
                      }}
                      onBlur={emailField.onBlur}
                    />
                  </View>

                  {errors.email?.message ? (
                    <Text style={styles.errorText}>{errors.email.message}</Text>
                  ) : null}
                </View>

                {usePasswordLogin ? (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                      {t("emailScreen.passwordLogin.passwordLabel")}
                    </Text>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons
                        name="lock"
                        size={20}
                        color={colors.textMutedAccent}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder={t(
                          "emailScreen.passwordLogin.passwordPlaceholder",
                        )}
                        placeholderTextColor={colors.textMutedAccent}
                        secureTextEntry
                        textContentType="password"
                        autoComplete="password"
                        style={[
                          styles.input,
                          passwordError ? styles.inputError : undefined,
                        ]}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          setPasswordError(null);
                          setServerError(null);
                        }}
                      />
                    </View>
                    {passwordError ? (
                      <Text style={styles.errorText}>{passwordError}</Text>
                    ) : null}
                  </View>
                ) : null}

                {serverError ? (
                  <Text style={styles.serverError}>{serverError}</Text>
                ) : null}
                {infoMessage ? (
                  <Text style={styles.info}>{infoMessage}</Text>
                ) : null}

                <View style={styles.primaryAction}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.primaryButtonPressed,
                      isBusy && styles.primaryButtonDisabled,
                    ]}
                    onPress={onPressPrimary}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <ActivityIndicator color="#111813" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        {usePasswordLogin
                          ? t("emailScreen.signIn")
                          : t("emailScreen.continue")}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>

              <View style={styles.footer}>
                <View style={styles.securityRow}>
                  <MaterialIcons
                    name="lock"
                    size={14}
                    color={colors.textMutedAccent}
                    style={styles.lockIcon}
                  />
                  <Text style={styles.securityText}>
                    {t("emailScreen.secureAndEncryptedAuthentication")}
                  </Text>
                </View>

                <Text style={styles.termsText}>
                  <Text>{t("emailScreen.terms.lead")}</Text>
                  <Text
                    accessibilityRole="link"
                    onPress={() => setLegalDocument("terms")}
                    style={styles.termsLink}
                  >
                    {t("emailScreen.termsOfService")}
                  </Text>
                  <Text>{t("emailScreen.terms.middle")}</Text>
                  <Text
                    accessibilityRole="link"
                    onPress={() => setLegalDocument("privacy")}
                    style={styles.termsLink}
                  >
                    {t("emailScreen.privacyPolicy")}
                  </Text>
                  <Text>{t("emailScreen.terms.trail")}</Text>
                </Text>
              </View>
            </ScrollView>

            <View style={styles.decorativeBubble} />
          </View>
        </View>
      </KeyboardAvoidingView>

      {legalDocument != null ? (
        <LegalScrollModal
          documentId={legalDocument}
          onClose={() => setLegalDocument(null)}
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E9F0EB",
  },
  keyboardAvoid: {
    flex: 1,
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
  tokenWrapper: {
    flex: 1,
    alignItems: "center",
    paddingRight: 48,
  },
  tokenBackground: {
    backgroundColor: colors.accentMuted,
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
    color: colors.textMutedAccent,
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
    borderColor: "#BFDBFE",
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
    backgroundColor: colors.accentSolid,
    shadowColor: colors.accentSolid,
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
    color: colors.onAccent,
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
    color: colors.textMutedAccent,
  },
  termsText: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMutedAccent,
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
    backgroundColor: colors.accentWash,
    bottom: -96,
    right: -96,
  },
});
