import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "@/src/components/ui/AppHeader";
import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { TokenBalancePill } from "@/src/components/ui/TokenBalancePill";
import { userFacingQueryLoadHint } from "@/src/lib/i18n/userFacingErrorHint";
import { theme } from "@/src/theme";

import { MissionCard } from "../components/MissionCard";
import type { AvailableMission } from "../hooks/useAvailableMissionsQuery";
import { useAvailableMissionsQuery } from "../hooks/useAvailableMissionsQuery";

type MissionFilterId = "all" | "survey" | "video" | "follow";

const FILTER_ORDER: MissionFilterId[] = ["all", "survey", "video", "follow"];

function MissionsInfoBanner() {
  const { t } = useTranslation();
  return (
    <View style={bannerStyles.root}>
      <MaterialIcons
        name="info-outline"
        size={22}
        color={theme.colors.accentSolid}
      />
      <Text style={bannerStyles.text}>{t("missions.list.infoBanner")}</Text>
    </View>
  );
}

export function MissionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<MissionFilterId>("all");

  const {
    data: missions,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useAvailableMissionsQuery();

  const filteredMissions = useMemo(() => {
    if (!missions) return [];
    if (filter === "all") return missions;
    return missions.filter((m) => m.mission_type === filter);
  }, [missions, filter]);

  const handleMissionPress = (mission: AvailableMission) => {
    router.push(`/missions/${mission.id}`);
  };

  const listBottomPadding =
    theme.spacing.xl + Math.max(insets.bottom, theme.spacing.sm);

  const shellHeader = (
    <AppHeader
      title={t("missions.layout.title")}
      titleAlign="start"
      rightSlot={<TokenBalancePill />}
    />
  );

  if (isLoading) {
    return (
      <Screen>
        {shellHeader}
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
        {shellHeader}
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t("missions.screen.error")}</Text>
          <Text style={styles.errorDetail}>{userFacingQueryLoadHint(t)}</Text>
          <View style={styles.retryWrap}>
            <Button title={t("common.retry")} onPress={() => refetch()} />
          </View>
        </View>
      </Screen>
    );
  }

  if (!missions || missions.length === 0) {
    return (
      <Screen>
        {shellHeader}
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t("missions.screen.empty")}</Text>
        </View>
      </Screen>
    );
  }

  const listHeader = (
    <View style={styles.listHeader}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {FILTER_ORDER.map((id) => {
          const selected = filter === id;
          return (
            <Pressable
              key={id}
              onPress={() => setFilter(id)}
              style={[
                styles.chip,
                selected ? styles.chipActive : styles.chipIdle,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                style={[
                  styles.chipLabel,
                  selected ? styles.chipLabelActive : styles.chipLabelIdle,
                ]}
              >
                {t(`missions.list.filter.${id}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <SectionHeader
        title={t("missions.list.sectionTitle")}
        subtitle={t("missions.list.sectionSubtitle")}
      />
    </View>
  );

  return (
    <Screen style={styles.screen}>
      {shellHeader}
      <FlatList
        data={filteredMissions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.filteredEmpty}>
            <Text style={styles.emptyText}>
              {t("missions.list.emptyFilter")}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <MissionCard mission={item} onPress={handleMissionPress} />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: listBottomPadding },
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          <View style={styles.footer}>
            {filteredMissions.length > 0 ? <MissionsInfoBanner /> : null}
            {hasNextPage ? (
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
            ) : null}
          </View>
        }
      />
    </Screen>
  );
}

const bannerStyles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.accentBorderMuted,
  },
  text: {
    flex: 1,
    ...theme.typography.cardBody,
    color: theme.colors.textMutedAccent,
    lineHeight: 20,
  },
});

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textMutedAccent,
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
  retryWrap: {
    marginTop: theme.spacing.lg,
  },
  emptyText: {
    color: theme.colors.textMutedAccent,
    textAlign: "center",
  },
  listHeader: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  chipsScroll: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  chip: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipActive: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  chipIdle: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
  },
  chipLabel: {
    fontSize: 14,
  },
  chipLabelActive: {
    color: theme.colors.surface,
    fontWeight: "600",
  },
  chipLabelIdle: {
    color: theme.colors.textMutedAccent,
    fontWeight: "500",
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.screenHorizontal,
    paddingTop: theme.spacing.sm,
  },
  separator: {
    height: theme.spacing.md,
  },
  filteredEmpty: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.sm,
  },
  footer: {
    alignItems: "center",
    gap: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  loadMoreButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
  },
  loadMoreText: {
    color: theme.colors.text,
    fontWeight: "500",
  },
});
