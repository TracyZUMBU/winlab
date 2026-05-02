import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
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
import { SegmentedControl } from "@/src/components/ui/SegmentedControl";
import { TokenBalancePill } from "@/src/components/ui/TokenBalancePill";
import { userFacingQueryLoadHint } from "@/src/lib/i18n/userFacingErrorHint";
import { theme } from "@/src/theme";

import { MissionCard } from "../components/MissionCard";
import { useCompletedMissionsQuery } from "../hooks/useCompletedMissionsQuery";
import type { AvailableMission } from "../hooks/useTodoMissionsQuery";
import { useTodoMissionsQuery } from "../hooks/useTodoMissionsQuery";

type MissionFilterId = "all" | "survey" | "video" | "follow";

type MissionStatusTabId = "todo" | "completed";

const FILTER_ORDER: MissionFilterId[] = ["all", "survey", "video", "follow"];

const STATUS_TAB_ORDER: MissionStatusTabId[] = ["todo", "completed"];

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
  const [statusTab, setStatusTab] = useState<MissionStatusTabId>("todo");

  const todoQuery = useTodoMissionsQuery();
  const completedQuery = useCompletedMissionsQuery({
    enabled: statusTab === "completed",
  });

  const activeQuery = statusTab === "todo" ? todoQuery : completedQuery;

  const filteredMissions = useMemo(() => {
    const list = activeQuery.data ?? [];
    if (filter === "all") return list;
    return list.filter((m) => m.mission_type === filter);
  }, [activeQuery.data, filter]);

  const handleMissionPress = (mission: AvailableMission) => {
    const id = mission.id?.trim();
    if (!id) return;
    // Chemin relatif au segment `missions/` : évite les échecs de linking
    // (`getStateFromPath`) observés avec `/missions/uuid` depuis cet écran.
    router.push(`./${id}`, { relativeToDirectory: true });
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

  const sectionTitleKey =
    statusTab === "todo"
      ? "missions.list.sectionTitle"
      : "missions.list.sectionTitleCompleted";

  const sectionSubtitleKey =
    statusTab === "todo"
      ? "missions.list.sectionSubtitle"
      : "missions.list.sectionSubtitleCompleted";

  const listEmptyMessageKey = useMemo(() => {
    if (filter !== "all") return "missions.list.emptyFilter";
    if (statusTab === "completed") return "missions.list.emptyCompleted";
    return "missions.screen.empty";
  }, [filter, statusTab]);

  if (statusTab === "todo" && todoQuery.isPending) {
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

  if (statusTab === "todo" && todoQuery.isError) {
    return (
      <Screen>
        {shellHeader}
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t("missions.screen.error")}</Text>
          <Text style={styles.errorDetail}>{userFacingQueryLoadHint(t)}</Text>
          <View style={styles.retryWrap}>
            <Button
              title={t("common.retry")}
              onPress={() => todoQuery.refetch()}
            />
          </View>
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
        title={t(sectionTitleKey)}
        subtitle={t(sectionSubtitleKey)}
      />
      <SegmentedControl
        items={STATUS_TAB_ORDER.map((id) => ({
          value: id,
          label: t(`missions.list.statusTab.${id}`),
        }))}
        value={statusTab}
        onValueChange={setStatusTab}
      />
    </View>
  );

  const showCompletedBlocking =
    statusTab === "completed" &&
    (completedQuery.isPending || completedQuery.isError);

  return (
    <Screen style={styles.screen}>
      {shellHeader}
      {showCompletedBlocking ? (
        <View style={styles.listContent}>
          {listHeader}
          {completedQuery.isPending ? (
            <View style={styles.tabBodyLoading}>
              <ActivityIndicator
                size="large"
                color={theme.colors.accentSolid}
              />
              <Text style={styles.loadingText}>
                {t("missions.screen.loading")}
              </Text>
            </View>
          ) : (
            <View style={styles.tabBodyLoading}>
              <Text style={styles.errorText}>{t("missions.screen.error")}</Text>
              <Text style={styles.errorDetail}>
                {userFacingQueryLoadHint(t)}
              </Text>
              <View style={styles.retryWrap}>
                <Button
                  title={t("common.retry")}
                  onPress={() => completedQuery.refetch()}
                />
              </View>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredMissions}
          refreshControl={
            <RefreshControl
              refreshing={activeQuery.isRefetching}
              onRefresh={() => {
                if (statusTab === "todo") void todoQuery.refetch();
                else void completedQuery.refetch();
              }}
              tintColor={theme.colors.accentSolid}
              colors={[theme.colors.accentSolid]}
              title={t("missions.list.pullToRefreshTitle")}
            />
          }
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={styles.filteredEmpty}>
              <Text style={styles.emptyText}>{t(listEmptyMessageKey)}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <MissionCard
              mission={item}
              onPress={handleMissionPress}
              showStatusBadge={statusTab === "completed"}
            />
          )}
          keyExtractor={(item) =>
            statusTab === "completed" && item.mission_completions?.[0]
              ? item.mission_completions[0].id
              : item.id
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: listBottomPadding },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={
            <View style={styles.footer}>
              {statusTab === "todo" && filteredMissions.length > 0 ? (
                <MissionsInfoBanner />
              ) : null}
              {activeQuery.hasNextPage ? (
                <Pressable
                  onPress={() => activeQuery.fetchNextPage()}
                  style={styles.loadMoreButton}
                  disabled={activeQuery.isFetchingNextPage}
                >
                  {activeQuery.isFetchingNextPage ? (
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
      )}
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
  tabBodyLoading: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 200,
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
