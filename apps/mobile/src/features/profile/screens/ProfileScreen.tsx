import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
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
import { usernameSchema } from "@/src/features/auth/validators";
import { useWalletBalanceQuery } from "@/src/features/wallet/hooks/useWalletBalanceQuery";
import { getI18nMessageForCode } from "@/src/lib/i18n/errorCodeMessage";
import { logger } from "@/src/lib/logger";
import { theme } from "@/src/theme";

import { ProfileHeroHeader } from "../components/ProfileHeroHeader";
import { ProfileMenuRow } from "../components/ProfileMenuRow";
import { useDeleteMyAccountMutation } from "../hooks/useDeleteMyAccountMutation";
import { useMyProfileQuery } from "../hooks/useMyProfileQuery";
import { useUpdateMyProfileMutation } from "../hooks/useUpdateMyProfileMutation";

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

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, status: authStatus } = useAuthSession();
  const userId = user?.id ?? null;

  const profileQuery = useMyProfileQuery();
  const balanceQuery = useWalletBalanceQuery();
  const updateMutation = useUpdateMyProfileMutation();
  const deleteMyAccountMutation = useDeleteMyAccountMutation();
  const signOutMutation = useSignOutMutation();

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [draftUsername, setDraftUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

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

  const openParticipations = useCallback(() => {
    router.push("/results");
  }, [router]);

  const openReferral = useCallback(() => {
    const code =
      profile?.referral_code?.trim() || t("profile.screen.valueUnknown");
    Alert.alert(
      t("profile.menu.referralAlertTitle"),
      `${code}\n\n${t("profile.menu.referralAlertHint")}`,
    );
  }, [profile?.referral_code, t]);

  const openSupport = useCallback(() => {
    Alert.alert(t("profile.menu.support"), t("profile.menu.supportMessage"));
  }, [t]);

  const openRegulations = useCallback(() => {
    Alert.alert(
      t("profile.menu.regulations"),
      t("profile.menu.regulationsMessage"),
    );
  }, [t]);

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
  const handleLabel = usernameRaw
    ? `@${usernameRaw}`
    : t("profile.hero.handlePlaceholder");

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
        {showUpdateSuccess ? (
          <Text style={styles.successBanner}>
            {t("profile.screen.updateSuccess")}
          </Text>
        ) : null}

        <ProfileHeroHeader
          displayName={displayName}
          handleLabel={handleLabel}
          balanceLine={balanceLine}
          onPressEdit={startEditUsername}
          editA11yLabel={t("profile.hero.a11yEdit")}
          avatarUri={profile.avatar_url}
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
        visible={isEditingUsername}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={cancelEditUsername}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t("profile.screen.editUsername")}
            </Text>
            <Pressable
              onPress={cancelEditUsername}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t("profile.screen.cancelEdit")}
            >
              <MaterialIcons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>
          <View style={styles.modalBody}>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t("profile.screen.usernamePlaceholder")}
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.input,
                usernameError ? styles.inputError : undefined,
              ]}
              value={draftUsername}
              onChangeText={(text) => {
                setDraftUsername(text);
                setUsernameError(null);
              }}
            />
            {usernameError ? (
              <Text style={styles.errorTextSmall}>{usernameError}</Text>
            ) : null}
            <Button
              title={
                updateMutation.isPending
                  ? t("profile.screen.savingUsername")
                  : t("profile.screen.saveUsername")
              }
              onPress={() => void handleSaveUsername()}
              disabled={updateMutation.isPending}
              variant="primary"
              fullWidth
            />
          </View>
        </KeyboardAvoidingView>
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
  successBanner: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.accentSolid,
    marginBottom: theme.spacing.sm,
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
