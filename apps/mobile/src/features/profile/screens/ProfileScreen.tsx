import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isValid, parse } from "date-fns";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeaderFull } from "@/src/components/ui/AppHeaderFull";
import { Button } from "@/src/components/ui/Button";
import { ListGroup } from "@/src/components/ui/ListGroup";
import { Screen } from "@/src/components/ui/Screen";
import { ScreenSectionOverline } from "@/src/components/ui/ScreenSectionOverline";
import { AUTH_ROUTES } from "@/src/features/auth/constants/authConstants";
import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";
import { useSignOutMutation } from "@/src/features/auth/hooks/useSignOutMutation";
import { useWalletBalanceQuery } from "@/src/features/wallet/hooks/useWalletBalanceQuery";
import { getI18nMessageForCode } from "@/src/lib/i18n/errorCodeMessage";
import { userFacingQueryLoadHint } from "@/src/lib/i18n/userFacingErrorHint";
import { logger } from "@/src/lib/logger";
import { showSuccessToast } from "@/src/shared/toast";
import { theme } from "@/src/theme";

import { BirthDatePickerSheet } from "../components/BirthDatePickerSheet";
import { ProfileHeroHeader } from "../components/ProfileHeroHeader";
import { ProfileMenuRow } from "../components/ProfileMenuRow";
import { useDeleteMyAccountMutation } from "../hooks/useDeleteMyAccountMutation";
import { useMyProfileQuery } from "../hooks/useMyProfileQuery";
import { useUpdateMyProfileMutation } from "../hooks/useUpdateMyProfileMutation";
import { useUploadAvatarMutation } from "../hooks/useUploadAvatarMutation";
import { resolveAvatarDisplayUri } from "../services/avatarStorage";
import {
  AvatarUploadError,
  getUploadErrorDiagnosticText,
} from "../services/uploadMyAvatar";
import type { ProfileSex } from "../types/profileSex";
import { CreateProfileError } from "../types/profileTypes";
import {
  editProfileFormSchema,
  editProfileSexFieldOrder,
  type EditProfileFormValues,
} from "../validators/editProfileFormSchema";

function formatTokenBalance(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    value,
  );
}

function appVersionLabel(t: (k: string, o?: Record<string, string>) => string) {
  const version = Constants.expoConfig?.version ?? "—";
  const build =
    Constants.expoConfig?.ios?.buildNumber ??
    (Constants.expoConfig?.android?.versionCode != null
      ? String(Constants.expoConfig.android.versionCode)
      : "—");
  return t("profile.footer.versionLine", {
    appName: t("app.name"),
    version,
    build,
  });
}

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

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, status: authStatus } = useAuthSession();
  const userId = user?.id ?? null;

  const profileQuery = useMyProfileQuery();
  const balanceQuery = useWalletBalanceQuery();
  const updateMutation = useUpdateMyProfileMutation();
  const uploadAvatarMutation = useUploadAvatarMutation();
  const deleteMyAccountMutation = useDeleteMyAccountMutation();
  const signOutMutation = useSignOutMutation();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [birthSheetOpen, setBirthSheetOpen] = useState(false);

  const editForm = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileFormSchema),
    defaultValues: {
      username: "",
      birth_date: "",
      sex: undefined,
    },
  });

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
  } = editForm;

  const usernameField = register("username");
  const usernameValue = watch("username");
  const birthDateValue = watch("birth_date");
  const selectedSex = watch("sex");

  const profile = profileQuery.data;

  const balanceLine = useMemo(() => {
    if (balanceQuery.isLoading) {
      return t("profile.hero.balanceLoading");
    }
    if (balanceQuery.isError) {
      return t("profile.hero.tokensLine", {
        count: 0,
        tokens: t("wallet.hero.tokens"),
      });
    }
    const n = balanceQuery.data?.balance ?? 0;
    const formatted = formatTokenBalance(n, i18n.language);
    return t("profile.hero.tokensLine", {
      count: Number(formatted),
      tokens: t("wallet.hero.tokens"),
    });
  }, [
    balanceQuery.data?.balance,
    balanceQuery.isError,
    balanceQuery.isLoading,
    i18n.language,
    t,
  ]);

  const birthDateDisplay = formatBirthDateForDisplay(
    birthDateValue,
    i18n.language,
  );

  const startEditProfile = useCallback(() => {
    if (!profile) return;
    reset({
      username: profile.username?.trim() ?? "",
      birth_date: profile.birth_date ?? "",
      sex: profile.sex ?? undefined,
    });
    setBirthSheetOpen(false);
    setIsEditingProfile(true);
  }, [profile, reset]);

  const cancelEditProfile = useCallback(() => {
    setBirthSheetOpen(false);
    setIsEditingProfile(false);
  }, []);

  const openBirthDatePicker = useCallback(() => {
    Keyboard.dismiss();
    setBirthSheetOpen(true);
  }, []);

  const onSubmitEditProfile = useCallback(
    async (values: EditProfileFormValues) => {
      if (!userId || values.sex === undefined) {
        return;
      }

      try {
        await updateMutation.mutateAsync({
          username: values.username,
          birth_date: values.birth_date,
          sex: values.sex,
        });
        setIsEditingProfile(false);
        setBirthSheetOpen(false);
        showSuccessToast({ title: t("profile.screen.updateSuccess") });
      } catch (error: unknown) {
        if (
          error instanceof CreateProfileError &&
          error.code === "USERNAME_TAKEN"
        ) {
          const message = getI18nMessageForCode({
            t,
            i18n,
            baseKey: "profile.createProfile.errors",
            code: error.code,
            fallbackKey: "profile.screen.updateError",
          });
          editForm.setError("username", { message });
          return;
        }
        logger.error("Profile update failed", error);
        Alert.alert(t("profile.screen.title"), t("profile.screen.updateError"));
      }
    },
    [editForm, i18n, t, updateMutation, userId],
  );

  const handleLogout = useCallback(() => {
    signOutMutation.mutate(undefined, {
      onSuccess: () => {
        router.replace(AUTH_ROUTES.email);
      },
      onError: (error) => {
        logger.error("Logout failed", error);
      },
    });
  }, [router, signOutMutation]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      t("profile.screen.deleteAccountConfirmTitle"),
      t("profile.screen.deleteAccountConfirmMessage"),
      [
        {
          text: t("profile.screen.deleteAccountCancel"),
          style: "cancel",
        },
        {
          text: t("profile.screen.deleteAccountConfirmCta"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              const result = await deleteMyAccountMutation.mutateAsync();
              if (!result.success) {
                const message =
                  result.kind === "business"
                    ? getI18nMessageForCode({
                        t,
                        i18n,
                        baseKey: "profile.deleteAccount.errors",
                        code: result.errorCode,
                        fallbackKey: "profile.deleteAccount.errors.generic",
                      })
                    : t("profile.deleteAccount.errors.generic");
                Alert.alert(
                  t("profile.screen.deleteAccountErrorTitle"),
                  message,
                );
                return;
              }

              signOutMutation.mutate(undefined, {
                onSuccess: () => {
                  router.replace(AUTH_ROUTES.email);
                },
                onError: (error) => {
                  logger.error("Logout after delete failed", error);
                  router.replace(AUTH_ROUTES.email);
                },
              });
            })();
          },
        },
      ],
    );
  }, [deleteMyAccountMutation, i18n, router, signOutMutation, t]);

  const openParticipations = useCallback(() => {
    router.push("/results");
  }, [router]);

  const openReferral = useCallback(() => {
    router.push("/referral");
  }, [router]);

  const openSupport = useCallback(() => {
    Alert.alert(t("profile.menu.support"), t("profile.menu.supportMessage"));
  }, [t]);

  const openRegulations = useCallback(() => {
    Alert.alert(
      t("profile.menu.regulations"),
      t("profile.menu.regulationsMessage"),
    );
  }, [t]);

  const handleChangeAvatar = useCallback(async () => {
    if (!userId || uploadAvatarMutation.isPending) {
      return;
    }

    let pickFromLibrary: typeof import("../utils/pickProfileAvatarFromLibrary").pickProfileAvatarFromLibrary;
    try {
      const mod = await import("../utils/pickProfileAvatarFromLibrary");
      type PickFn =
        typeof import("../utils/pickProfileAvatarFromLibrary").pickProfileAvatarFromLibrary;
      let resolved: PickFn | undefined;
      if (typeof mod.pickProfileAvatarFromLibrary === "function") {
        resolved = mod.pickProfileAvatarFromLibrary;
      } else if (typeof mod.default === "function") {
        resolved = mod.default as PickFn;
      } else if (
        mod.default !== null &&
        typeof mod.default === "object" &&
        "pickProfileAvatarFromLibrary" in mod.default
      ) {
        const nested = (
          mod.default as unknown as {
            pickProfileAvatarFromLibrary: unknown;
          }
        ).pickProfileAvatarFromLibrary;
        if (typeof nested === "function") {
          resolved = nested as PickFn;
        }
      }
      if (typeof resolved !== "function") {
        logger.error(
          "pickProfileAvatarFromLibrary missing after dynamic import",
          undefined,
          {
            modKeys: Object.keys(mod as object),
            developerHint:
              "Dynamic import did not expose pickProfileAvatarFromLibrary or default export. Rebuild the native app (npx expo run:ios | npx expo run:android). Ensure expo-image-picker is in app.json plugins.",
          },
        );
        Alert.alert(
          t("profile.screen.title"),
          t("profile.avatar.nativeModuleMissing"),
        );
        return;
      }
      pickFromLibrary = resolved;
    } catch (error: unknown) {
      logger.error("expo-image-picker native module unavailable", error, {
        developerHint:
          "expo-image-picker chunk failed to load. Rebuild native client; verify iOS Info.plist photo usage and Android permissions from expo-image-picker plugin.",
      });
      Alert.alert(
        t("profile.screen.title"),
        t("profile.avatar.nativeModuleMissing"),
      );
      return;
    }

    try {
      const outcome = await pickFromLibrary();
      if (outcome.status === "permission_denied") {
        Alert.alert(
          t("profile.screen.title"),
          t("profile.avatar.permissionDenied"),
        );
        return;
      }
      if (outcome.status === "cancelled") {
        return;
      }

      await uploadAvatarMutation.mutateAsync({
        localUri: outcome.uri,
        mimeType: outcome.mimeType,
      });
      showSuccessToast({ title: t("profile.avatar.success") });
    } catch (error: unknown) {
      const diagnosticMsg = getUploadErrorDiagnosticText(error);
      if (
        diagnosticMsg.includes("ExponentImagePicker") ||
        diagnosticMsg.includes("native module")
      ) {
        logger.error(
          "Avatar: image picker native error (user shown generic message)",
          error instanceof Error ? error : undefined,
          {
            message: diagnosticMsg,
            developerHint:
              "Rebuild development build with expo-image-picker (npx expo run:ios | npx expo run:android).",
          },
        );
        Alert.alert(
          t("profile.screen.title"),
          t("profile.avatar.nativeModuleMissing"),
        );
        return;
      }
      if (
        error instanceof AvatarUploadError &&
        error.code === "INVALID_IMAGE_TYPE"
      ) {
        Alert.alert(
          t("profile.screen.title"),
          t("profile.avatar.invalidImage"),
        );
        return;
      }
      if (diagnosticMsg.includes("Bucket not found")) {
        logger.error("Avatar upload failed: storage bucket missing", error, {
          developerHint:
            "Supabase Storage bucket `avatars` is missing on this project. Apply repo migrations (e.g. supabase db push / migration up --linked) or create the bucket in the Storage dashboard.",
        });
        Alert.alert(
          t("profile.screen.title"),
          t("profile.avatar.storageBucketMissing"),
        );
        return;
      }
      if (
        diagnosticMsg.includes("row-level security") ||
        diagnosticMsg.includes("violates row-level security")
      ) {
        logger.error("Avatar upload failed: storage RLS denied", error, {
          developerHint:
            "storage.objects policies for bucket `avatars` rejected the upload. Apply latest Supabase migrations from this repo (storage RLS / folder+filename rules).",
        });
        Alert.alert(
          t("profile.screen.title"),
          t("profile.avatar.storageRlsDenied"),
        );
        return;
      }
      logger.error("Avatar upload failed", error);
      Alert.alert(t("profile.screen.title"), t("profile.avatar.uploadFailed"));
    }
  }, [t, uploadAvatarMutation, userId]);

  const listBottomPadding =
    theme.spacing.xl + Math.max(insets.bottom, theme.spacing.md);

  if (authStatus === "loading") {
    return (
      <Screen edges={["top"]} style={styles.screenBg}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
          <Text style={styles.loadingText}>{t("profile.screen.loading")}</Text>
        </View>
      </Screen>
    );
  }

  if (!userId) {
    return (
      <Screen edges={["top"]} style={styles.screenBg}>
        <View style={styles.fallbackBody}>
          <Text style={styles.fallbackTitle}>{t("profile.screen.title")}</Text>
          <Text style={styles.muted}>
            {t("profile.screen.sessionRequired")}
          </Text>
        </View>
      </Screen>
    );
  }

  if (profileQuery.isPending) {
    return (
      <Screen edges={["top"]} style={styles.screenBg}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
          <Text style={styles.loadingText}>{t("profile.screen.loading")}</Text>
        </View>
      </Screen>
    );
  }

  if (profileQuery.isError) {
    return (
      <Screen edges={["top"]} style={styles.screenBg}>
        <View style={styles.fallbackBody}>
          <Text style={styles.fallbackTitle}>{t("profile.screen.title")}</Text>
          <Text style={styles.errorText}>{t("profile.screen.error")}</Text>
          <Text style={styles.muted}>{userFacingQueryLoadHint(t)}</Text>
          <Button
            title={t("common.retry")}
            onPress={() => void profileQuery.refetch()}
            variant="primary"
          />
        </View>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen edges={["top"]} style={styles.screenBg}>
        <View style={styles.fallbackBody}>
          <Text style={styles.fallbackTitle}>{t("profile.screen.title")}</Text>
          <Text style={styles.muted}>{t("profile.screen.notFound")}</Text>
        </View>
      </Screen>
    );
  }

  const usernameRaw = profile.username?.trim() ?? "";
  const displayName = usernameRaw || t("profile.hero.defaultDisplayName");
  const emailLabel = profile.email ?? "";

  return (
    <Screen edges={["top"]} style={styles.screenBg}>
      <View style={styles.headerWrap}>
        <AppHeaderFull
          title={t("profile.screen.title")}
          titleAlign="center"
          showBottomBorder={false}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: listBottomPadding },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeroHeader
          displayName={displayName}
          emailLabel={emailLabel}
          balanceLine={balanceLine}
          onPressEdit={startEditProfile}
          editA11yLabel={t("profile.hero.a11yEdit")}
          onPressChangeAvatar={handleChangeAvatar}
          changeAvatarA11yLabel={t("profile.hero.changeAvatarA11y")}
          avatarUri={resolveAvatarDisplayUri(
            profile.avatar_url,
            profile.updated_at,
          )}
        />

        <ScreenSectionOverline label={t("profile.section.activityRewards")} />
        <ListGroup>
          <ProfileMenuRow
            icon="confirmation-number"
            iconVariant="accent"
            title={t("profile.menu.participations")}
            onPress={openParticipations}
            showDivider
            accessibilityLabel={t("profile.menu.participationsA11y")}
          />
          <ProfileMenuRow
            icon="group-add"
            iconVariant="accent"
            title={t("profile.menu.referral")}
            subtitle={t("profile.menu.referralSubtitle")}
            onPress={openReferral}
            accessibilityLabel={t("profile.menu.referralA11y")}
          />
        </ListGroup>

        <ScreenSectionOverline
          label={t("profile.section.supportInfo")}
          style={styles.overlineSpaced}
        />
        <ListGroup>
          <ProfileMenuRow
            icon="help-center"
            iconVariant="neutral"
            title={t("profile.menu.support")}
            onPress={openSupport}
            showDivider
            accessibilityLabel={t("profile.menu.supportA11y")}
          />
          <ProfileMenuRow
            icon="policy"
            iconVariant="neutral"
            title={t("profile.menu.regulations")}
            onPress={openRegulations}
            accessibilityLabel={t("profile.menu.regulationsA11y")}
          />
        </ListGroup>

        <ScreenSectionOverline
          label={t("profile.section.account")}
          style={styles.overlineSpaced}
        />
        <ListGroup>
          <ProfileMenuRow
            icon="delete-forever"
            iconVariant="destructive"
            title={
              deleteMyAccountMutation.isPending
                ? t("profile.screen.deletingAccount")
                : t("profile.screen.deleteAccount")
            }
            onPress={handleDeleteAccount}
            disabled={
              signOutMutation.isPending ||
              updateMutation.isPending ||
              uploadAvatarMutation.isPending ||
              deleteMyAccountMutation.isPending
            }
            accessibilityLabel={t("profile.menu.deleteAccountA11y")}
          />
        </ListGroup>

        <Pressable
          onPress={handleLogout}
          disabled={
            signOutMutation.isPending ||
            updateMutation.isPending ||
            uploadAvatarMutation.isPending ||
            deleteMyAccountMutation.isPending
          }
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutPressed,
            signOutMutation.isPending && styles.logoutDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("profile.screen.logout")}
        >
          <MaterialIcons
            name="logout"
            size={22}
            color={theme.colors.dangerSolid}
          />
          <Text style={styles.logoutLabel}>
            {signOutMutation.isPending
              ? t("profile.screen.loggingOut")
              : t("profile.screen.logout")}
          </Text>
        </Pressable>

        <View style={styles.footerMeta}>
          <Text style={styles.versionText}>{appVersionLabel(t)}</Text>
          <Text style={styles.tagline}>{t("profile.footer.tagline")}</Text>
        </View>
      </ScrollView>

      <Modal
        visible={isEditingProfile}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={cancelEditProfile}
      >
        <View style={styles.modalHost}>
          <KeyboardAvoidingView
            style={styles.modalRoot}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("profile.screen.editProfile")}
              </Text>
              <Pressable
                onPress={cancelEditProfile}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={t("profile.screen.cancelEdit")}
              >
                <MaterialIcons
                  name="close"
                  size={24}
                  color={theme.colors.text}
                />
              </Pressable>
            </View>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  {t("profile.createProfile.screen.label")}
                </Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder={t("profile.screen.usernamePlaceholder")}
                  placeholderTextColor={theme.colors.textMuted}
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
                  <Text style={styles.errorTextSmall}>
                    {errors.username.message}
                  </Text>
                ) : null}
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
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
                    pressed && styles.dateFieldPressed,
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
                {errors.birth_date?.message ? (
                  <Text style={styles.errorTextSmall}>
                    {errors.birth_date.message}
                  </Text>
                ) : null}
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  {t("profile.createProfile.screen.sexLabel")}
                </Text>
                <View style={styles.sexOptions} accessibilityRole="radiogroup">
                  {editProfileSexFieldOrder.map((value) => {
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
                  <Text style={styles.errorTextSmall}>
                    {errors.sex.message}
                  </Text>
                ) : null}
              </View>

              <Button
                title={
                  updateMutation.isPending
                    ? t("profile.screen.savingProfile")
                    : t("profile.screen.saveProfile")
                }
                onPress={() => void handleSubmit(onSubmitEditProfile)()}
                disabled={
                  updateMutation.isPending || uploadAvatarMutation.isPending
                }
                variant="primary"
                fullWidth
              />
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
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenBg: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerWrap: {
    paddingHorizontal: theme.spacing.md,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  overlineSpaced: {
    marginTop: theme.spacing.md,
  },
  logoutButton: {
    marginTop: theme.spacing.lg + 4,
    minHeight: 56,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.dangerMuted,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  logoutPressed: {
    opacity: 0.92,
  },
  logoutDisabled: {
    opacity: 0.55,
  },
  logoutLabel: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: theme.colors.dangerSolid,
  },
  footerMeta: {
    marginTop: theme.spacing.lg,
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  versionText: {
    fontSize: 12,
    color: theme.colors.textMutedAccent,
    textAlign: "center",
  },
  tagline: {
    fontSize: 10,
    fontStyle: "italic",
    color: theme.colors.textMutedAccent,
    opacity: 0.72,
    textAlign: "center",
    lineHeight: 14,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
  },
  loadingText: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  fallbackBody: {
    padding: 16,
    gap: 16,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
  },
  muted: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  errorText: {
    fontSize: 15,
    color: theme.colors.dangerSolid,
  },
  modalHost: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalRoot: {
    flex: 1,
    paddingTop: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    ...theme.typography.sectionTitle,
    color: theme.colors.text,
  },
  modalBody: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  fieldBlock: {
    gap: theme.spacing.xs,
  },
  fieldLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },
  fieldHint: {
    fontSize: 12,
    color: theme.colors.textGrayLight,
  },
  dateFieldButton: {
    justifyContent: "center",
  },
  dateFieldPressed: {
    opacity: 0.92,
  },
  dateFieldText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  dateFieldPlaceholder: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  sexOptions: {
    gap: theme.spacing.sm,
  },
  sexOption: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  sexOptionSelected: {
    borderColor: theme.colors.accentSolid,
    backgroundColor: theme.colors.accentWash,
  },
  sexOptionPressed: {
    opacity: 0.92,
  },
  sexOptionLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  sexOptionLabelSelected: {
    fontWeight: "600",
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  inputError: {
    borderColor: theme.colors.dangerSolid,
  },
  errorTextSmall: {
    fontSize: 13,
    color: theme.colors.dangerSolid,
  },
});
