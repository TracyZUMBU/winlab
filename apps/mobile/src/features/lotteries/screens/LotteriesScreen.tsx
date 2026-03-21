import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "@/src/components/ui/Screen";
import { theme } from "@/src/theme";

import type { AvailableLotteryUi } from "../hooks/useAvailableLotteriesQuery";
import { useAvailableLotteriesQuery } from "../hooks/useAvailableLotteriesQuery";

function LotteryCard({
  lottery,
  onPress,
}: {
  lottery: AvailableLotteryUi;
  onPress: (lotteryId: string) => void;
}) {
  const brandName = lottery.brand?.name ?? "";

  return (
    <Pressable style={styles.card} onPress={() => onPress(lottery.id)}>
      {lottery.image_url ? (
        <Image source={{ uri: lottery.image_url }} style={styles.image} />
      ) : null}
      <View style={styles.cardBody}>
        <Text style={styles.title}>{lottery.title}</Text>
        {brandName ? <Text style={styles.brand}>{brandName}</Text> : null}
        <View style={styles.row}>
          <Text style={styles.meta}>{lottery.ticketCostLabel}</Text>
          <Text style={styles.meta}>{lottery.participantsLabel}</Text>
        </View>
        <Text style={styles.time}>{lottery.timeRemainingLabel}</Text>
      </View>
    </Pressable>
  );
}

export function LotteriesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useAvailableLotteriesQuery();

  const openDetail = (lotteryId: string) => {
    router.push(`/lotteries/${lotteryId}`);
  };

  const goToResults = () => {
    router.push("/lotteries/results");
  };

  const resultsLink = (
    <View style={styles.resultsLinkWrap}>
      <Pressable onPress={goToResults}>
        <Text style={styles.resultsLink}>{t("lottery.screen.goToResults")}</Text>
      </Pressable>
    </View>
  );

  if (isLoading) {
    return (
      <Screen>
        {resultsLink}
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
        {resultsLink}
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t("lottery.screen.error")}</Text>
          {error instanceof Error ? (
            <Text style={styles.helper}>{error.message}</Text>
          ) : null}
          <Pressable style={styles.retryButton} onPress={() => void refetch()}>
            <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const lotteries = data ?? [];
  if (lotteries.length === 0) {
    return (
      <Screen>
        {resultsLink}
        <View style={styles.centered}>
          <Text style={styles.helper}>{t("lottery.screen.empty")}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {resultsLink}
      <FlatList
        data={lotteries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => <LotteryCard lottery={item} onPress={openDetail} />}
        ListFooterComponent={
          hasNextPage ? (
            <View style={styles.footer}>
              <Pressable
                onPress={() => void fetchNextPage()}
                style={styles.loadMoreButton}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.accentSolid}
                  />
                ) : (
                  <Text style={styles.loadMoreText}>{t("common.loadMore")}</Text>
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
  resultsLinkWrap: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  resultsLink: {
    color: theme.colors.accentSolid,
    fontSize: 15,
    fontWeight: "600",
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
    color: "#fff",
    fontWeight: "600",
  },
  list: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  separator: {
    height: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  cardBody: {
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  brand: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  row: {
    marginTop: theme.spacing.xs,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  time: {
    color: theme.colors.accentSolid,
    fontSize: 13,
    fontWeight: "600",
    marginTop: theme.spacing.xs,
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
