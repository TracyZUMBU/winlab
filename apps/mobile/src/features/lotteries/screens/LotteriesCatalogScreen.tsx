import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Screen } from "@/src/components/ui/Screen";
import { TokenBalancePill } from "@/src/components/ui/TokenBalancePill";
import { trackEvent } from "@/src/lib/analytics/trackEvent";
import { useNow } from "@/src/lib/date/useNow";
import { userFacingQueryLoadHint } from "@/src/lib/i18n/userFacingErrorHint";
import { theme } from "@/src/theme";

import { LotteryCatalogFeedSkeleton } from "../components/LotteryCatalogFeedSkeleton";
import { LotteryMarketplaceCard } from "../components/LotteryMarketplaceCard";
import { useAvailableLotteriesQuery } from "../hooks/useAvailableLotteriesQuery";
import type { LotteryCatalogScope } from "../utils/lotteryCatalog";
import {
  compareLotteriesForCatalog,
  filterLotteriesByCategory,
  filterLotteriesByScope,
  filterLotteriesBySearchQuery,
  parseLotteryCatalogScope,
} from "../utils/lotteryCatalog";
import { splitLotteriesIntoMasonryColumns } from "../utils/lotteryCatalogMasonryLayout";

type CategoryId = "all" | string;

function UnderlineOptionStrip<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.stripScroll}
    >
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={styles.uTab}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <Text
              style={[styles.uTabLabel, selected && styles.uTabLabelActive]}
              numberOfLines={1}
            >
              {opt.label.charAt(0).toUpperCase() +
                opt.label.slice(1).toLowerCase()}
            </Text>
            <View
              style={[
                styles.uTabUnderlineTrack,
                selected && styles.uTabUnderlineActive,
              ]}
            />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function LotteriesCatalogScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ filter?: string | string[] }>();
  const rawFilter = params.filter;

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId>("all");

  const nowMs = useNow({ intervalMs: 60_000 });

  const scope: LotteryCatalogScope = useMemo(
    () => parseLotteryCatalogScope(rawFilter),
    [rawFilter],
  );

  useEffect(() => {
    setQuery("");
    setCategory("all");
    trackEvent("lotteries_catalog_enter", {
      filter: parseLotteryCatalogScope(rawFilter),
    });
  }, [rawFilter]);

  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useAvailableLotteriesQuery();

  const lotteries = useMemo(() => data ?? [], [data]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const l of lotteries) {
      const raw = l.category?.trim();
      if (raw) unique.add(raw);
    }
    return [
      "all" as const,
      ...Array.from(unique).sort((a, b) => a.localeCompare(b)),
    ];
  }, [lotteries]);

  const rows = useMemo(() => {
    const sorted = [...lotteries].sort(compareLotteriesForCatalog);
    const byScope = filterLotteriesByScope(sorted, scope, nowMs);
    const byCategory = filterLotteriesByCategory(byScope, category);
    return filterLotteriesBySearchQuery(byCategory, query);
  }, [lotteries, scope, category, query, nowMs]);

  const { left: leftColumn, right: rightColumn } = useMemo(
    () => splitLotteriesIntoMasonryColumns(rows),
    [rows],
  );

  const categoryOptions = useMemo(
    () =>
      categories.map((id) => ({
        id,
        label: id === "all" ? t("lotteries.list.categories.all") : id,
      })),
    [categories, t],
  );

  const openDetail = useCallback(
    (lotteryId: string) => {
      router.push(`/lotteries/${lotteryId}`);
    },
    [router],
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const threshold = 280;
      if (
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - threshold
      ) {
        if (hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const marketplaceHeader = (
    <View style={styles.heroBlock}>
      <View style={styles.heroTop}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconCircle}
          accessibilityRole="button"
          accessibilityLabel={t("lotteries.catalog.a11y.back")}
        >
          <MaterialIcons
            name="arrow-back-ios-new"
            size={20}
            color={theme.colors.text}
          />
        </Pressable>
        <TokenBalancePill />
      </View>
    </View>
  );

  const filterChrome = (
    <View style={styles.filterChrome}>
      <View style={styles.searchWrap}>
        <MaterialIcons
          name="search"
          size={18}
          color={theme.colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("lotteries.list.searchPlaceholder")}
          placeholderTextColor={theme.colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>
      <UnderlineOptionStrip
        options={categoryOptions}
        value={category}
        onChange={(id) => setCategory(id)}
      />
    </View>
  );

  if (isError) {
    return (
      <Screen edges={["top"]}>
        <View style={styles.screenPad}>{marketplaceHeader}</View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t("lottery.screen.error")}</Text>
          <Text style={styles.helper}>{userFacingQueryLoadHint(t)}</Text>
          <Pressable style={styles.retryButton} onPress={() => void refetch()}>
            <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const showInitialSkeleton = isLoading && lotteries.length === 0;

  return (
    <Screen edges={["top"]}>
      {showInitialSkeleton ? (
        <View style={styles.screenPad}>
          {marketplaceHeader}
          {filterChrome}
          <LotteryCatalogFeedSkeleton />
        </View>
      ) : lotteries.length === 0 ? (
        <View style={styles.screenPad}>
          {marketplaceHeader}
          <View style={styles.centered}>
            <Text style={styles.helper}>{t("lottery.screen.empty")}</Text>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.screenPad}>
            {marketplaceHeader}
            {filterChrome}
          </View>

          {rows.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                {t("lotteries.catalog.emptyFiltered")}
              </Text>
            </View>
          ) : (
            <View style={styles.masonry}>
              <View style={styles.masonryCol}>
                {leftColumn.map(({ item, layout }) => (
                  <LotteryMarketplaceCard
                    key={item.id}
                    lottery={item}
                    layout={layout}
                    onPress={openDetail}
                  />
                ))}
              </View>
              <View style={[styles.masonryCol, styles.masonryColRight]}>
                {rightColumn.map(({ item, layout }) => (
                  <LotteryMarketplaceCard
                    key={item.id}
                    lottery={item}
                    layout={layout}
                    onPress={openDetail}
                  />
                ))}
              </View>
            </View>
          )}

          {isFetchingNextPage ? (
            <View style={styles.footerSpinner}>
              <ActivityIndicator
                size="small"
                color={theme.colors.accentSolid}
              />
            </View>
          ) : null}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenPad: {
    paddingHorizontal: theme.spacing.screenHorizontal,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  heroBlock: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  filterChrome: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  stripScroll: {
    flexDirection: "row",
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
    paddingRight: theme.spacing.lg,
  },
  uTab: {
    paddingVertical: theme.spacing.xs,
  },
  uTabLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textMutedAccent,
  },
  uTabLabelActive: {
    color: theme.colors.text,
    fontWeight: "800",
  },
  uTabUnderlineTrack: {
    marginTop: 6,
    height: 3,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  uTabUnderlineActive: {
    backgroundColor: theme.colors.accentSolid,
  },
  searchWrap: {
    position: "relative",
    justifyContent: "center",
  },
  searchIcon: {
    position: "absolute",
    left: theme.spacing.md,
    zIndex: 1,
  },
  searchInput: {
    height: 48,
    paddingLeft: theme.spacing.md + 22,
    paddingRight: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "400",
  },
  masonry: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: theme.spacing.screenHorizontal,
    gap: theme.spacing.md,
  },
  masonryCol: {
    flex: 1,
  },
  masonryColRight: {
    paddingTop: 12,
  },
  emptyWrap: {
    paddingVertical: theme.spacing.xl * 2,
    paddingHorizontal: theme.spacing.screenHorizontal,
    alignItems: "center",
  },
  emptyText: {
    color: theme.colors.textMuted,
    textAlign: "center",
    fontSize: 15,
  },
  footerSpinner: {
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  helper: {
    marginTop: theme.spacing.md,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  errorText: {
    color: theme.colors.text,
    textAlign: "center",
    fontSize: 15,
  },
  retryButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.accentSolid,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  retryButtonText: {
    color: theme.colors.onAccent,
    fontWeight: "600",
  },
});
