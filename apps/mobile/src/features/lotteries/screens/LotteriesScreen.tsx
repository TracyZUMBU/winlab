import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Screen } from "@/src/components/ui/Screen";
import { TokenBalancePill } from "@/src/components/ui/TokenBalancePill";
import { userFacingQueryLoadHint } from "@/src/lib/i18n/userFacingErrorHint";
import { theme } from "@/src/theme";

import { trackEvent } from "@/src/lib/analytics/trackEvent";

import { AppHeaderFull } from "@/src/components/ui/AppHeaderFull";
import { LotteryEndingSoonCard } from "../components/LotteryEndingSoonCard";
import { LotteryFeaturedCard } from "../components/LotteryFeaturedCard";
import { LotteryGiftCardTile } from "../components/LotteryGiftCardTile";
import { useAvailableLotteriesQuery } from "../hooks/useAvailableLotteriesQuery";

type CategoryId = "all" | string;

export function LotteriesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId>("all");

  const { data, isLoading, isError, refetch } = useAvailableLotteriesQuery();

  const openDetail = (lotteryId: string) => {
    router.push(`/lotteries/${lotteryId}`);
  };

  const goToResults = () => {
    router.push("/results");
  };

  const goToCatalog = (filter: "endingSoon" | "featured" | "giftCard") => {
    trackEvent("lotteries_hub_see_all_section", { section: filter });
    router.push(`/lotteries/all?filter=${filter}`);
  };

  const goToCatalogAll = () => {
    trackEvent("lotteries_hub_catalog_cta");
    router.push("/lotteries/all");
  };

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lotteries.filter((l) => {
      const matchesCategory =
        category === "all"
          ? true
          : (l.category ?? "").toLowerCase() === category.toLowerCase();
      const matchesQuery =
        q.length === 0
          ? true
          : `${l.title} ${l.brand?.name ?? ""}`.toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [lotteries, category, query]);

  const giftCards = filtered
    .filter((l) => l.category === "gift-card")
    .slice(0, 2);

  const nonGiftCards = filtered.filter((l) => l.category !== "gift-card");
  const featured = nonGiftCards.filter((l) => l.is_featured).slice(0, 2);
  const endingSoon = nonGiftCards.filter((l) => !l.is_featured).slice(0, 2);

  if (isLoading) {
    return (
      <Screen>
        <Header
          title={t("lotteries.layout.title")}
          query={query}
          onQueryChange={setQuery}
          categories={categories}
          category={category}
          onCategoryChange={setCategory}
          onPressResults={goToResults}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
          <Text style={styles.helper}>{t("lottery.screen.loading")}</Text>
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Header
          title={t("lotteries.layout.title")}
          query={query}
          onQueryChange={setQuery}
          categories={categories}
          category={category}
          onCategoryChange={setCategory}
          onPressResults={goToResults}
        />
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

  if (lotteries.length === 0) {
    return (
      <Screen>
        <Header
          title={t("lotteries.layout.title")}
          query={query}
          onQueryChange={setQuery}
          categories={categories}
          category={category}
          onCategoryChange={setCategory}
          onPressResults={goToResults}
        />
        <View style={styles.centered}>
          <Text style={styles.helper}>{t("lottery.screen.empty")}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title={t("lotteries.layout.title")}
        query={query}
        onQueryChange={setQuery}
        categories={categories}
        category={category}
        onCategoryChange={setCategory}
        onPressResults={goToResults}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {t("lotteries.list.sections.endingSoon")}
          </Text>
          <Pressable
            onPress={() => goToCatalog("endingSoon")}
            accessibilityRole="button"
          >
            <Text style={styles.sectionAction}>
              {t("lotteries.list.seeAll")}
            </Text>
          </Pressable>
        </View>

        <View style={styles.grid2}>
          {endingSoon.map((l) => (
            <View key={l.id} style={styles.gridItem}>
              <LotteryEndingSoonCard lottery={l} onPress={openDetail} />
            </View>
          ))}
        </View>

        {featured.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {t("lotteries.list.sections.featuredPrizes")}
              </Text>
              <Pressable
                onPress={() => goToCatalog("featured")}
                accessibilityRole="button"
              >
                <Text style={styles.sectionAction}>
                  {t("lotteries.list.seeAll")}
                </Text>
              </Pressable>
            </View>
            <View style={styles.stack}>
              {featured.map((l) => (
                <LotteryFeaturedCard
                  key={l.id}
                  lottery={l}
                  onPress={openDetail}
                />
              ))}
            </View>
          </>
        )}

        {giftCards.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {t("lotteries.list.sections.giftCards")}
              </Text>
              <Pressable
                onPress={() => goToCatalog("giftCard")}
                accessibilityRole="button"
              >
                <Text style={styles.sectionAction}>
                  {t("lotteries.list.seeAll")}
                </Text>
              </Pressable>
            </View>
            <View style={styles.grid2}>
              {giftCards.map((l, index) => (
                <View key={l.id} style={styles.gridItem}>
                  <LotteryGiftCardTile
                    lottery={l}
                    onPress={openDetail}
                    variant={index % 2 === 0 ? "warm" : "fresh"}
                  />
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.catalogCtaWrap}>
          <Pressable
            onPress={goToCatalogAll}
            style={styles.catalogCta}
            accessibilityRole="button"
          >
            <Text style={styles.catalogCtaText}>
              {t("lotteries.catalog.cta.viewAll")}
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={theme.colors.onAccent}
            />
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Header({
  title,
  query,
  onQueryChange,
  categories,
  category,
  onCategoryChange,
  onPressResults,
}: {
  title: string;
  query: string;
  onQueryChange: (next: string) => void;
  categories: readonly string[];
  category: CategoryId;
  onCategoryChange: (next: CategoryId) => void;
  onPressResults: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.headerRoot}>
      <AppHeaderFull
        title={title}
        titleAlign="start"
        leftSlot={
          <View style={styles.headerIcon}>
            <MaterialIcons
              name="casino"
              size={18}
              color={theme.colors.onAccent}
            />
          </View>
        }
        rightSlot={<TokenBalancePill />}
        showBottomBorder={false}
      />

      <View style={styles.searchWrap}>
        <MaterialIcons
          name="search"
          size={18}
          color={theme.colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder={t("lotteries.list.searchPlaceholder")}
          placeholderTextColor={theme.colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {categories.map((id) => {
          const selected = category.toLowerCase() === id.toLowerCase();
          const label = id === "all" ? t("lotteries.list.categories.all") : id;

          return (
            <Pressable
              key={id}
              onPress={() => onCategoryChange(id)}
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
                numberOfLines={1}
              >
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={onPressResults}
          style={[styles.chip, styles.chipResults]}
          accessibilityRole="button"
        >
          <MaterialIcons
            name="emoji-events"
            size={16}
            color={theme.colors.text}
          />
          <Text
            style={[styles.chipLabel, styles.chipLabelIdle]}
            numberOfLines={1}
          >
            {t("lottery.screen.goToResults")}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRoot: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.screenHorizontal,
    backgroundColor: theme.colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
    gap: theme.spacing.md,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
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
  chipsScroll: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipActive: {
    backgroundColor: theme.colors.accentSolid,
    borderColor: theme.colors.accentSolid,
  },
  chipIdle: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
  },
  chipResults: {
    backgroundColor: theme.colors.accentMuted,
    borderColor: theme.colors.accentBorderMuted,
  },
  chipLabel: {
    fontSize: 13,
  },
  chipLabelActive: {
    color: theme.colors.onAccent,
    fontWeight: "800",
  },
  chipLabelIdle: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.screenHorizontal,
    paddingTop: theme.spacing.md,
    // paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    ...theme.typography.sectionTitle,
  },
  sectionAction: {
    color: theme.colors.accentSolid,
    fontSize: 13,
    fontWeight: "800",
  },
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -theme.spacing.sm / 2,
    rowGap: theme.spacing.md,
  },
  gridItem: {
    width: "50%",
    paddingHorizontal: theme.spacing.sm / 2,
  },
  stack: {
    gap: theme.spacing.md,
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
  catalogCtaWrap: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  catalogCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSolid,
  },
  catalogCtaText: {
    color: theme.colors.onAccent,
    fontSize: 16,
    fontWeight: "800",
  },
});
