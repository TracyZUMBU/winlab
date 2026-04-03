import { AuthScreenLayout } from "@/src/features/auth/components/AuthScreenLayout";
import { AUTH_ROUTES } from "@/src/features/auth/constants/authConstants";
import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";
import { getI18nMessageForCode } from "@/src/lib/i18n/errorCodeMessage";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isValid, parse } from "date-fns";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BirthDatePickerSheet } from "../components/BirthDatePickerSheet";
import { useCreateProfileMutation } from "../hooks/useCreateProfileMutation";
import type { ProfileSex } from "../types/profileSex";
import { CreateProfileError } from "../types/profileTypes";
import {
  CREATE_PROFILE_SEX_FIELD_ORDER,
  createProfileFormSchema,
  type CreateProfileFormValues,
} from "../validators/createProfileFormSchema";

const ACCENT = "#FF8C00";

function sexTranslationKey(value: ProfileSex): string {
  return `profile.createProfile.screen.sex.${value}`;
}

/** Affichage localisé : FR = JJ-MM-AAAA, sinon JJ/MM/AAAA. La valeur formulaire reste `YYYY-MM-DD`. */
function formatBirthDateForDisplay(
  isoYyyyMmDd: string | undefined,
  language: string,
): string {
  if (!isoYyyyMmDd?.trim()) {
    return "";
  }
  const d = parse(isoYyyyMmDd, "yyyy-MM-dd", new Date());
  if (!isValid(d)) {
    return "";
  }
  const pattern = language.startsWith("fr") ? "dd-MM-yyyy" : "dd/MM/yyyy";
  return format(d, pattern);
}

export const CreateProfileScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, status } = useAuthSession();
  const createProfileMutation = useCreateProfileMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [birthSheetOpen, setBirthSheetOpen] = useState(false);

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProfileFormValues>({
    resolver: zodResolver(createProfileFormSchema),
    defaultValues: {
      username: "",
      birth_date: "",
      sex: undefined,
    },
  });

  const usernameField = register("username");
  const usernameValue = watch("username");
  const birthDateValue = watch("birth_date");
  const selectedSex = watch("sex");

  const birthDateDisplay = formatBirthDateForDisplay(
    birthDateValue,
    i18n.language,
  );

  const openBirthDatePicker = () => {
    Keyboard.dismiss();
    setBirthSheetOpen(true);
  };

  const onSubmit = async (values: CreateProfileFormValues) => {
    setServerError(null);

    if (!user) {
      setServerError(t("profile.createProfile.errors.sessionExpired"));
      router.replace(AUTH_ROUTES.email);
      return;
    }

    if (!user.email) {
      setServerError(t("profile.createProfile.errors.emailUnavailable"));
      router.replace(AUTH_ROUTES.email);
      return;
    }

    if (values.sex === undefined) {
      return;
    }

    try {
      await createProfileMutation.mutateAsync({
        userId: user.id,
        email: user.email,
        username: values.username,
        birth_date: values.birth_date,
        sex: values.sex,
      });

      router.replace("/home");
    } catch (e) {
      if (e instanceof CreateProfileError) {
        setServerError(
          getI18nMessageForCode({
            t,
            i18n,
            baseKey: "profile.createProfile.errors",
            code: e.code,
            fallbackKey: "profile.createProfile.errors.submitFailed",
          }),
        );
      } else {
        setServerError(t("profile.createProfile.errors.submitFailed"));
      }
    }
  };

  const isLoadingSession = status === "loading";
  const isSubmittingProfile = createProfileMutation.isPending;
  const isPending = isLoadingSession || isSubmittingProfile || isSubmitting;

  return (
    <AuthScreenLayout
      title={t("profile.createProfile.screen.title")}
      subtitle={t("profile.createProfile.screen.subtitle")}
    >
      <>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={
            Platform.OS === "ios" ? insets.top + 120 : 0
          }
        >
          <ScrollView
            keyboardShouldPersistTaps="always"
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 24 + insets.bottom + 100 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                {t("profile.createProfile.screen.label")}
              </Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={t("profile.createProfile.screen.placeholder")}
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

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                {t("profile.createProfile.screen.birthDateLabel")}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(
                  "profile.createProfile.screen.birthDatePickerA11y",
                )}
                onPress={openBirthDatePicker}
                style={({ pressed }) => [
                  styles.input,
                  styles.dateFieldButton,
                  errors.birth_date ? styles.inputError : undefined,
                  pressed && styles.dateFieldButtonPressed,
                ]}
              >
                <Text
                  style={
                    birthDateDisplay
                      ? styles.dateFieldText
                      : styles.dateFieldPlaceholder
                  }
                >
                  {birthDateDisplay ||
                    t("profile.createProfile.screen.birthDatePlaceholder")}
                </Text>
              </Pressable>
              <Text style={styles.fieldHint}>
                {t("profile.createProfile.screen.birthDateHint")}
              </Text>
              {errors.birth_date?.message ? (
                <Text style={styles.errorText}>
                  {errors.birth_date.message}
                </Text>
              ) : null}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                {t("profile.createProfile.screen.sexLabel")}
              </Text>
              <View style={styles.sexOptions} accessibilityRole="radiogroup">
                {CREATE_PROFILE_SEX_FIELD_ORDER.map((value) => {
                  const selected = selectedSex === value;
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      style={({ pressed }) => [
                        styles.sexOption,
                        selected && styles.sexOptionSelected,
                        pressed && styles.sexOptionPressed,
                      ]}
                      onPress={() =>
                        setValue("sex", value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.sexOptionLabel,
                          selected && styles.sexOptionLabelSelected,
                        ]}
                      >
                        {t(sexTranslationKey(value))}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.sex?.message ? (
                <Text style={styles.errorText}>{errors.sex.message}</Text>
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
                  isPending && styles.primaryButtonDisabled,
                ]}
                onPress={handleSubmit(onSubmit)}
                disabled={isPending}
              >
                {isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {t("profile.createProfile.screen.submit")}
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <BirthDatePickerSheet
          visible={birthSheetOpen}
          onClose={() => setBirthSheetOpen(false)}
          onConfirm={(iso) => {
            setValue("birth_date", iso, { shouldValidate: true });
          }}
          initialIso={birthDateValue || undefined}
          language={i18n.language}
        />
      </>
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
    marginTop: 16,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.5,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
  },
  fieldHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#94A3B8",
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
  dateFieldButton: {
    justifyContent: "center",
  },
  dateFieldButtonPressed: {
    opacity: 0.92,
  },
  dateFieldText: {
    fontSize: 16,
    color: "#020617",
  },
  dateFieldPlaceholder: {
    fontSize: 16,
    color: "#94A3B8",
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
  sexOptions: {
    gap: 8,
  },
  sexOption: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  sexOptionSelected: {
    borderColor: ACCENT,
    backgroundColor: "#FFF7ED",
  },
  sexOptionPressed: {
    opacity: 0.92,
  },
  sexOptionLabel: {
    fontSize: 16,
    color: "#020617",
  },
  sexOptionLabelSelected: {
    fontWeight: "600",
    color: "#020617",
  },
  footer: {
    marginTop: 24,
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
