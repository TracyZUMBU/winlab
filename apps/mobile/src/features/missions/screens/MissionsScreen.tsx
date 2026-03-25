import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Screen } from "@/src/components/ui/Screen";
import { userFacingQueryLoadHint } from "@/src/lib/i18n/userFacingErrorHint";
import { theme } from "@/src/theme";
import type { AvailableMission } from "../hooks/useAvailableMissionsQuery";
import { useAvailableMissionsQuery } from "../hooks/useAvailableMissionsQuery";

const DESCRIPTION_MAX_LENGTH = 80;

function truncateDescription(description: string | null): string {
  if (!description) return "";
  if (description.length <= DESCRIPTION_MAX_LENGTH) return description;
  return description.slice(0, DESCRIPTION_MAX_LENGTH).trim() + "…";
}

function StatusBadge({ status }: { status: AvailableMission["userStatus"] }) {
  const labels: Record<AvailableMission["userStatus"], string> = {
    available: "Disponible",
    pending: "En attente",
    completed: "Complétée",
  };
  const statusStyle =
    status === "completed"
      ? styles.badgeCompleted
      : status === "pending"
        ? styles.badgePending
        : styles.badgeAvailable;

  return (
    <View style={[styles.badge, statusStyle]}>
      <Text style={styles.badgeText}>{labels[status]}</Text>
    </View>
  );
}

function MissionCard({
  mission,
  onPress,
}: {
  mission: AvailableMission;
  onPress: (mission: AvailableMission) => void;
}) {
  const brandName = mission.brand?.name ?? "—";
  const description = truncateDescription(mission.description);

  return (
    <Pressable style={styles.card} onPress={() => onPress(mission)}>
      <View style={styles.cardHeader}>
        {mission.brand?.logo_url ? (
          <Image
            source={{ uri: mission.brand.logo_url }}
            style={styles.brandLogo}
            accessibilityLabel={`Logo ${brandName}`}
          />
        ) : null}
        <Text style={styles.brandName}>{brandName}</Text>
        <StatusBadge status={mission.userStatus} />
      </View>
      <Text style={styles.title}>{mission.title}</Text>
      {description ? (
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      ) : null}
      <View style={styles.meta}>
        <Text style={styles.metaText}>{mission.mission_type}</Text>
        <Text style={styles.metaText}>•</Text>
        <Text style={styles.tokenReward}>{mission.token_reward} tokens</Text>
      </View>
    </Pressable>
  );
}

export function MissionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    data: missions,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useAvailableMissionsQuery();

  const handleMissionPress = (mission: AvailableMission) => {
    router.push(`/missions/${mission.id}`);
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
          <Text style={styles.loadingText}>{t("missions.screen.loading")}</Text>
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t("missions.screen.error")}</Text>
          <Text style={styles.errorDetail}>{userFacingQueryLoadHint(t)}</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (!missions || missions.length === 0) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t("missions.screen.empty")}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={missions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MissionCard mission={item} onPress={handleMissionPress} />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          hasNextPage ? (
            <View style={styles.footer}>
              <Pressable
                onPress={() => fetchNextPage()}
                style={styles.loadMoreButton}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.accentSolid}
                  />
                ) : (
                  <Text style={styles.loadMoreText}>
                    {t("missions.screen.loadMore")}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textMuted,
  },
  errorText: {
    color: theme.colors.text,
    textAlign: "center",
  },
  errorDetail: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  retryButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.accentSolid,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyText: {
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  separator: {
    height: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  brandLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  brandName: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeAvailable: {
    backgroundColor: "rgba(22, 163, 74, 0.15)",
  },
  badgePending: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  badgeCompleted: {
    backgroundColor: "rgba(107, 114, 128, 0.15)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.text,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  tokenReward: {
    fontSize: 12,
    color: theme.colors.accentSolid,
    fontWeight: "600",
  },
  footer: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  loadMoreButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
  },
  loadMoreText: {
    color: theme.colors.text,
    fontWeight: "500",
  },
});
