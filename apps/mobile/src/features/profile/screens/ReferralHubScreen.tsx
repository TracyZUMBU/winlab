import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { format, parseISO } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppHeader } from "@/src/components/ui/AppHeader";
import { ListGroup } from "@/src/components/ui/ListGroup";
import { Screen } from "@/src/components/ui/Screen";
import { ScreenSectionOverline } from "@/src/components/ui/ScreenSectionOverline";
import { useMyProfileQuery } from "@/src/features/profile/hooks/useMyProfileQuery";
import { useMyReferralInviteesQuery } from "@/src/features/profile/hooks/useMyReferralInviteesQuery";
import type { ReferralInviteeRow } from "@/src/features/profile/services/getMyReferralInvitees";
import { showErrorToast } from "@/src/shared/toast";
import { theme } from "@/src/theme";
import { capitalizeFirstLetter } from "@/src/utils";

function statusChipStyle(status: ReferralInviteeRow["status"]): {
  bg: string;
  text: string;
} {
  switch (status) {
    case "rewarded":
      return {
        bg: theme.colors.semantic.successMuted,
        text: theme.colors.success,
      };
    case "qualified":
      return {
        bg: theme.colors.semantic.warningMuted,
        text: "#B45309",
      };
    case "cancelled":
      return {
        bg: theme.colors.semantic.dangerMuted,
        text: theme.colors.dangerSolid,
      };
    default:
      return {
        bg: theme.colors.semantic.neutralMuted,
        text: theme.colors.textMuted,
      };
  }
}

export function ReferralHubScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const profileQuery = useMyProfileQuery();
  const inviteesQuery = useMyReferralInviteesQuery();

  const dateLocale = i18n.language.startsWith("fr") ? fr : enUS;

  const referralCode = profileQuery.data?.referral_code?.trim() ?? "";
  const codeDisplay =
    referralCode.length > 0 ? referralCode : t("profile.screen.valueUnknown");

  const shareBody = useMemo(() => {
    if (!referralCode) {
      return t("profile.referralHub.share.bodyFallback");
    }
    return t("profile.referralHub.share.body", { code: referralCode });
  }, [referralCode, t]);

  const shareTitle = t("profile.referralHub.share.title");

  const openNativeShare = useCallback(async () => {
    try {
      await Share.share({
        title: shareTitle,
        message: shareBody,
      });
    } catch {
      showErrorToast({
        title: t("profile.referralHub.share.errorTitle"),
        message: t("profile.referralHub.share.errorMessage"),
      });
    }
  }, [shareBody, shareTitle, t]);

  const formatInvitedAt = useCallback(
    (iso: string) => {
      try {
        return format(parseISO(iso), "d MMM yyyy", { locale: dateLocale });
      } catch {
        return "";
      }
    },
    [dateLocale],
  );

  return (
    <Screen edges={["top"]} style={styles.screen}>
      <View style={styles.topBar}>
        <AppHeader
          title={t("profile.referralHub.title")}
          titleAlign="center"
          showBottomBorder
          leftSlot={
            <Pressable
              onPress={() => router.back()}
              style={styles.iconCircle}
              accessibilityRole="button"
              accessibilityLabel={t("profile.referralHub.a11yBack")}
            >
              <MaterialIcons
                name="arrow-back-ios-new"
                size={20}
                color={theme.colors.text}
              />
            </Pressable>
          }
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: theme.spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenSectionOverline label={t("profile.referralHub.sectionCode")} />
        <ListGroup>
          <View style={styles.codeBlock}>
            <Text style={styles.codeLabel}>
              {t("profile.referralHub.codeLabel")}
            </Text>
            <Text style={styles.codeValue} selectable accessibilityRole="text">
              {codeDisplay}
            </Text>
            <Text style={styles.codeHint}>
              {t("profile.referralHub.codeHint")}
            </Text>

            <View style={styles.shareRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.sharePill,
                  pressed && styles.sharePillPressed,
                ]}
                onPress={() => void openNativeShare()}
                accessibilityRole="button"
                accessibilityLabel={t("profile.referralHub.share.nativeA11y")}
              >
                <MaterialIcons
                  name="share"
                  size={22}
                  color={theme.colors.onAccent}
                />
                <Text style={styles.sharePillLabel}>
                  {t("profile.referralHub.share.native")}
                </Text>
              </Pressable>
            </View>
          </View>
        </ListGroup>

        <ScreenSectionOverline
          label={t("profile.referralHub.sectionInvitees")}
          style={styles.overlineSpaced}
        />

        {inviteesQuery.isError ? (
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>
              {t("profile.referralHub.error")}
            </Text>
            <Pressable
              style={styles.retryBtn}
              onPress={() => void inviteesQuery.refetch()}
              accessibilityRole="button"
            >
              <Text style={styles.retryBtnText}>{t("common.retry")}</Text>
            </Pressable>
          </View>
        ) : inviteesQuery.isLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={theme.colors.accentSolid} />
            <Text style={styles.loadingHint}>
              {t("profile.referralHub.loadingInvitees")}
            </Text>
          </View>
        ) : !inviteesQuery.data?.length ? (
          <View style={styles.emptyBlock}>
            <MaterialIcons
              name="group-add"
              size={40}
              color={theme.colors.textMutedAccent}
            />
            <Text style={styles.emptyTitle}>
              {t("profile.referralHub.emptyTitle")}
            </Text>
            <Text style={styles.emptyBody}>
              {t("profile.referralHub.emptyBody")}
            </Text>
          </View>
        ) : (
          <View style={styles.inviteeList}>
            {inviteesQuery.data.map((row, index) => (
              <ListGroup
                key={row.referralId}
                style={index > 0 ? styles.inviteeCardSpaced : undefined}
              >
                <InviteeRow
                  row={row}
                  formatInvitedAt={formatInvitedAt}
                  statusLabel={t(`profile.referralHub.status.${row.status}`)}
                  displayName={
                    row.referredUsername?.trim() ||
                    t("profile.referralHub.invitee.anonymous")
                  }
                />
              </ListGroup>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function InviteeRow({
  row,
  formatInvitedAt,
  statusLabel,
  displayName,
}: {
  row: ReferralInviteeRow;
  formatInvitedAt: (iso: string) => string;
  statusLabel: string;
  displayName: string;
}) {
  const { t } = useTranslation();
  const chip = statusChipStyle(row.status);
  const sinceLabel = t("profile.referralHub.invitee.since", {
    date: formatInvitedAt(row.createdAt),
  });
  const qualifiedLabel =
    row.qualifiedAt != null && row.qualifiedAt.length > 0
      ? t("profile.referralHub.invitee.qualifiedOn", {
          date: formatInvitedAt(row.qualifiedAt),
        })
      : null;

  return (
    <View style={styles.inviteeInner}>
      <View style={styles.inviteeTop}>
        <Text style={styles.inviteeName} numberOfLines={1}>
          {capitalizeFirstLetter(displayName)}
        </Text>
        <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
          <Text style={[styles.statusChipText, { color: chip.text }]}>
            {statusLabel}
          </Text>
        </View>
      </View>
      <Text style={styles.inviteeMeta}>{sinceLabel}</Text>
      {qualifiedLabel ? (
        <Text style={styles.inviteeMetaSecondary}>{qualifiedLabel}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    backgroundColor: theme.colors.backgroundHeader,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.screenHorizontal,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  overlineSpaced: {
    marginTop: theme.spacing.md,
  },
  codeBlock: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  codeLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },
  codeValue: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 2,
    color: theme.colors.text,
  },
  codeHint: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textMutedAccent,
  },
  shareRow: {
    marginTop: theme.spacing.md,
  },
  sharePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSolid,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  sharePillPressed: {
    opacity: 0.9,
  },
  sharePillLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.onAccent,
  },
  loadingBlock: {
    paddingVertical: theme.spacing.xl,
    alignItems: "center",
    gap: theme.spacing.md,
  },
  loadingHint: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  errorBlock: {
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    gap: theme.spacing.md,
  },
  errorText: {
    fontSize: 15,
    color: theme.colors.dangerSolid,
    textAlign: "center",
  },
  retryBtn: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentWash,
    borderWidth: 1,
    borderColor: theme.colors.accentBorderMuted,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.accentSolid,
  },
  emptyBlock: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    marginTop: theme.spacing.sm,
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  inviteeList: {
    gap: 0,
  },
  inviteeCardSpaced: {
    marginTop: theme.spacing.md,
  },
  inviteeInner: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  inviteeTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  inviteeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  statusChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  inviteeMeta: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  inviteeMetaSecondary: {
    fontSize: 13,
    color: theme.colors.textMutedAccent,
  },
});
