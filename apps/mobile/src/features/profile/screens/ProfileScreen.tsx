import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { AUTH_ROUTES } from "@/src/features/auth/constants/authConstants";
import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";
import { useSignOutMutation } from "@/src/features/auth/hooks/useSignOutMutation";
import { usernameSchema } from "@/src/features/auth/validators";
import { getI18nMessageForCode } from "@/src/lib/i18n/errorCodeMessage";
import { logger } from "@/src/lib/logger";
import { theme } from "@/src/theme";

import { useMyProfileQuery } from "../hooks/useMyProfileQuery";
import { useDeleteMyAccountMutation } from "../hooks/useDeleteMyAccountMutation";
import { useUpdateMyProfileMutation } from "../hooks/useUpdateMyProfileMutation";

function formatMemberSince(iso: string | null, locale: string): string {
  if (!iso) {
    return "";
  }
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d);
}

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, status: authStatus } = useAuthSession();
  const userId = user?.id ?? null;

  const profileQuery = useMyProfileQuery();
  const updateMutation = useUpdateMyProfileMutation();
  const deleteMyAccountMutation = useDeleteMyAccountMutation();
  const signOutMutation = useSignOutMutation();

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [draftUsername, setDraftUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

  const profile = profileQuery.data;

  const memberSinceLabel = useMemo(
    () =>
      formatMemberSince(profile?.created_at ?? null, i18n.language) ||
      t("profile.screen.valueUnknown"),
    [profile?.created_at, i18n.language, t],
  );

  const startEditUsername = useCallback(() => {
    setUsernameError(null);
    setShowUpdateSuccess(false);
    setDraftUsername(profile?.username?.trim() ?? "");
    setIsEditingUsername(true);
  }, [profile?.username]);

  const cancelEditUsername = useCallback(() => {
    setUsernameError(null);
    setIsEditingUsername(false);
  }, []);

  const handleSaveUsername = useCallback(async () => {
    setUsernameError(null);
    setShowUpdateSuccess(false);

    if (!userId) {
      return;
    }

    const parsed = usernameSchema.safeParse({ username: draftUsername });
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors.username?.[0];
      setUsernameError(first ?? null);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        username: parsed.data.username,
      });
      setIsEditingUsername(false);
      setShowUpdateSuccess(true);
    } catch (error: unknown) {
      logger.error("Profile username update failed", error);
      setUsernameError(t("profile.screen.updateError"));
    }
  }, [draftUsername, t, updateMutation, userId]);

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
              if (!result.ok) {
                const message = getI18nMessageForCode({
                  t,
                  i18n,
                  baseKey: "profile.deleteAccount.errors",
                  code: result.code,
                  fallbackKey: "profile.deleteAccount.errors.generic",
                });
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

  if (authStatus === "loading") {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
          <Text style={styles.loadingText}>{t("profile.screen.loading")}</Text>
        </View>
      </Screen>
    );
  }

  if (!userId) {
    return (
      <Screen>
        <View style={styles.body}>
          <Text style={styles.title}>{t("profile.screen.title")}</Text>
          <Text style={styles.muted}>{t("profile.screen.sessionRequired")}</Text>
        </View>
      </Screen>
    );
  }

  if (profileQuery.isPending) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
          <Text style={styles.loadingText}>{t("profile.screen.loading")}</Text>
        </View>
      </Screen>
    );
  }

  if (profileQuery.isError) {
    return (
      <Screen>
        <View style={styles.body}>
          <Text style={styles.title}>{t("profile.screen.title")}</Text>
          <Text style={styles.errorText}>{t("profile.screen.error")}</Text>
          <Button
            title={t("common.retry")}
            onPress={() => profileQuery.refetch()}
            variant="primary"
          />
        </View>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        <View style={styles.body}>
          <Text style={styles.title}>{t("profile.screen.title")}</Text>
          <Text style={styles.muted}>{t("profile.screen.notFound")}</Text>
        </View>
      </Screen>
    );
  }

  const emailDisplay =
    profile.email?.trim() || user?.email?.trim() || t("profile.screen.emailUnknown");
  const referralDisplay =
    profile.referral_code?.trim() || t("profile.screen.valueUnknown");
  const usernameDisplay =
    profile.username?.trim() || t("profile.screen.valueUnknown");

  return (
    <Screen>
      <View style={styles.body}>
        <Text style={styles.title}>{t("profile.screen.title")}</Text>

        {showUpdateSuccess ? (
          <Text style={styles.successText}>{t("profile.screen.updateSuccess")}</Text>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>{t("profile.screen.usernameLabel")}</Text>
          {isEditingUsername ? (
            <>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={t("profile.screen.usernamePlaceholder")}
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.input, usernameError ? styles.inputError : undefined]}
                value={draftUsername}
                onChangeText={(text) => {
                  setDraftUsername(text);
                  setUsernameError(null);
                }}
              />
              {usernameError ? (
                <Text style={styles.errorTextSmall}>{usernameError}</Text>
              ) : null}
              <View style={styles.row}>
                <Button
                  title={
                    updateMutation.isPending
                      ? t("profile.screen.savingUsername")
                      : t("profile.screen.saveUsername")
                  }
                  onPress={() => void handleSaveUsername()}
                  disabled={updateMutation.isPending}
                  variant="primary"
                />
                <Button
                  title={t("profile.screen.cancelEdit")}
                  onPress={cancelEditUsername}
                  disabled={updateMutation.isPending}
                  variant="ghost"
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.value}>{usernameDisplay}</Text>
              <Button
                title={t("profile.screen.editUsername")}
                onPress={startEditUsername}
                variant="ghost"
              />
            </>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("profile.screen.emailLabel")}</Text>
          <Text style={styles.value}>{emailDisplay}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("profile.screen.referralLabel")}</Text>
          <Text style={styles.value}>{referralDisplay}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("profile.screen.memberSinceLabel")}</Text>
          <Text style={styles.value}>{memberSinceLabel}</Text>
        </View>

        <Button
          title={
            signOutMutation.isPending
              ? t("profile.screen.loggingOut")
              : t("profile.screen.logout")
          }
          onPress={handleLogout}
          disabled={
            signOutMutation.isPending ||
            updateMutation.isPending ||
            deleteMyAccountMutation.isPending
          }
          variant="primary"
        />

        <Button
          title={
            deleteMyAccountMutation.isPending
              ? t("profile.screen.deletingAccount")
              : t("profile.screen.deleteAccount")
          }
          onPress={handleDeleteAccount}
          disabled={
            signOutMutation.isPending ||
            updateMutation.isPending ||
            deleteMyAccountMutation.isPending
          }
          variant="ghost"
          style={{
            borderWidth: 1,
            borderColor: "#DC2626",
          }}
          textStyle={{
            color: "#DC2626",
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: 16,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: theme.colors.text,
  },
  muted: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  loadingText: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  field: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  inputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    fontSize: 15,
    color: "#DC2626",
  },
  errorTextSmall: {
    fontSize: 13,
    color: "#DC2626",
  },
  successText: {
    fontSize: 14,
    color: theme.colors.accentSolid,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
});
