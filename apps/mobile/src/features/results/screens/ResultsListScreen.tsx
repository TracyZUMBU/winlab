import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { userFacingQueryLoadHint } from "@/src/lib/i18n/userFacingErrorHint";
import { theme } from "@/src/theme";

import { ResultsListItemCard } from "../components/ResultsListItemCard";
import { useParticipatedDrawnLotteriesQuery } from "../hooks/useParticipatedDrawnLotteriesQuery";

export function ResultsListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useParticipatedDrawnLotteriesQuery();

  const openDetail = (lotteryId: string) => {
    router.push(`/results/${lotteryId}`);
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
          <Text style={styles.helper}>{userFacingQueryLoadHint(t)}</Text>
          <View style={styles.retryWrap}>
            <Button title={t("common.retry")} onPress={() => void refetch()} />
          </View>
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

  const totalTickets = rows.reduce((sum, r) => sum + r.userTicketsCount, 0);

  return (
    <Screen style={styles.screen}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <ResultsListItemCard item={item} onPress={openDetail} />
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.ticketPill} accessibilityRole="text">
              <MaterialIcons
                name="confirmation-number"
                size={16}
                color={theme.colors.text}
              />
              <Text style={styles.ticketPillText}>
                {t("results.list.totalTickets", { count: totalTickets })}
              </Text>
            </View>
          </View>
        }
        ListFooterComponent={
          hasNextPage ? (
            <View style={styles.footer}>
              <Button
                title={t("results.list.loadMore")}
                onPress={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="soft"
                leftIcon={
                  isFetchingNextPage ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.accentSolid}
                    />
                  ) : undefined
                }
              />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

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
  retryWrap: {
    marginTop: theme.spacing.lg,
    alignSelf: "stretch",
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.screenHorizontal,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  listHeader: {
    paddingBottom: theme.spacing.md,
  },
  ticketPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignSelf: "flex-start",
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderSubtle,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  ticketPillText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  separator: {
    height: theme.spacing.md,
  },
  footer: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
});
