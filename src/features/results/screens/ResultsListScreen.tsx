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

import type { ParticipatedDrawnLotteryUi } from "../hooks/useParticipatedDrawnLotteriesQuery";
import { useParticipatedDrawnLotteriesQuery } from "../hooks/useParticipatedDrawnLotteriesQuery";

function ResultRow({
  item,
  onPress,
}: {
  item: ParticipatedDrawnLotteryUi;
  onPress: (lotteryId: string) => void;
}) {
  const { t } = useTranslation();
  const brandName = item.brand?.name ?? "";

  return (
    <Pressable style={styles.card} onPress={() => onPress(item.id)}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} />
      ) : null}
      <View style={styles.cardBody}>
        <Text style={styles.title}>{item.title}</Text>
        {brandName ? <Text style={styles.brand}>{brandName}</Text> : null}
        <Text style={styles.meta}>{item.drawAtLabel}</Text>
        <Text style={styles.meta}>{item.userResultStatusLabel}</Text>
        <Text style={styles.meta}>
          {t("lottery.youHaveTickets", { count: item.userTicketsCount })}
        </Text>
        {item.winnerPosition != null ? (
          <Text style={styles.meta}>
            {t("results.list.winnerPosition", { position: item.winnerPosition })}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function ResultsListScreen() {
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
  } = useParticipatedDrawnLotteriesQuery();

  const openDetail = (lotteryId: string) => {
    router.push(`/lotteries/results/${lotteryId}`);
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
          <Text style={styles.helper}>{t("results.screen.loading")}</Text>
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t("results.screen.error")}</Text>
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

  const rows = data ?? [];
  if (rows.length === 0) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.helper}>{t("results.screen.empty")}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <ResultRow item={item} onPress={openDetail} />
        )}
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
  meta: {
    color: theme.colors.textMuted,
    fontSize: 13,
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
