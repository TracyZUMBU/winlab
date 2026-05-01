import { getI18nMessageForCode } from "@/src/lib/i18n/errorCodeMessage";
import { showInfoToast } from "@/src/shared/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
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
import { AuthScreenLayout } from "../components/AuthScreenLayout";
import { AUTH_ROUTES, OTP_CODE_LENGTH } from "../constants/authConstants";
import { sendEmailOtp, verifyEmailOtp } from "../services";
import { redirectAfterAuthSession } from "../utils/redirectAfterAuthSession";
import { otpSchema, type OtpFormValues } from "../validators";

const ACCENT = "#FF8C00";

export const OTPScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const emailFromParams = typeof params.email === "string" ? params.email : "";

  const [serverError, setServerError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      code: "",
      email: emailFromParams,
    },
  });

  const codeField = register("code");
  const codeValue = watch("code");

  const onSubmit = async (values: OtpFormValues) => {
    setServerError(null);

    const email = values.email ?? emailFromParams;
    if (!email) {
      setServerError(t("auth.otp.emailMissingInFlow"));
      router.replace(AUTH_ROUTES.email);
      return;
    }

    const result = await verifyEmailOtp({ email, token: values.code });

    if (!result.success) {
      if (result.kind === "business") {
        if (result.errorCode === "OTP_INVALID_LENGTH") {
          setServerError(
            t("auth.otp.errors.OTP_INVALID_LENGTH", {
              length: OTP_CODE_LENGTH,
            }),
          );
        } else {
          setServerError(
            getI18nMessageForCode({
              t,
              i18n,
              baseKey: "auth.otp.errors",
              code: result.errorCode,
              fallbackKey: "auth.otp.errors.generic",
            }),
          );
        }
      } else {
        setServerError(t("auth.otp.errors.generic"));
      }
      return;
    }

    const user = result.data.user;

    try {
      await redirectAfterAuthSession(router, user.id);
    } catch {
      setServerError(t("auth.genericError"));
    }
  };

  const handleResend = async () => {
    const email = emailFromParams;
    if (!email) {
      setServerError(t("auth.otp.emailMissingInFlow"));
      router.replace(AUTH_ROUTES.email);
      return;
    }

    setServerError(null);
    setResendLoading(true);
    try {
      const result = await sendEmailOtp({ email });

      if (!result.success) {
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
      } else {
        showInfoToast({ title: t("auth.otp.resendSuccess") });
      }
    } catch {
      setServerError(t("auth.email.errors.generic"));
    } finally {
      setResendLoading(false);
    }
  };

  const otpSubtitle = emailFromParams
    ? t("auth.otp.screen.subtitleWithEmail", { email: emailFromParams })
    : t("auth.otp.screen.subtitleNoEmail");

  return (
    <AuthScreenLayout title={t("schema.otp.title")} subtitle={otpSubtitle}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{t("schema.otp.label")}</Text>
            <TextInput
              keyboardType="number-pad"
              maxLength={OTP_CODE_LENGTH}
              placeholder={t("auth.otp.screen.codePlaceholder")}
              placeholderTextColor="#94A3B8"
              style={[
                styles.input,
                errors.code ? styles.inputError : undefined,
              ]}
              value={codeValue}
              onChangeText={(text) => {
                setValue("code", text.replace(/\D/g, ""), {
                  shouldValidate: true,
                });
              }}
              onBlur={codeField.onBlur}
            />
            {errors.code?.message ? (
              <Text style={styles.errorText}>{errors.code.message}</Text>
            ) : null}
          </View>

          {serverError ? (
            <Text style={styles.serverError}>{serverError}</Text>
          ) : null}

          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>
              {t("auth.otp.screen.resendPrompt")}
            </Text>
            <Pressable onPress={handleResend} disabled={resendLoading}>
              {resendLoading ? (
                <ActivityIndicator size="small" color={ACCENT} />
              ) : (
                <Text style={styles.resendLink}>
                  {t("auth.otp.screen.resendCta")}
                </Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
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
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {t("auth.otp.screen.submit")}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
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
    fontSize: 20,
    textAlign: "center",
    letterSpacing: 4,
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
  resendRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resendLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  resendLink: {
    fontSize: 14,
    fontWeight: "600",
    color: ACCENT,
  },
  footer: {
    marginTop: "auto",
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
