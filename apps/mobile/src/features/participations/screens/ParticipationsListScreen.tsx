import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { userFacingQueryLoadHint } from "@/src/lib/i18n/userFacingErrorHint";
import { theme } from "@/src/theme";

import { ParticipationListRow } from "../components/ParticipationListRow";
import {
  useUserParticipationsQuery,
  type UserParticipationUi,
} from "../hooks/useUserParticipationsQuery";

export function ParticipationsListScreen() {
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
  } = useUserParticipationsQuery();

  const openParticipation = (item: UserParticipationUi) => {
    if (item.status === "drawn") {
      router.push(`/results/${item.lotteryId}`);
      return;
    }
    router.push(`/lotteries/${item.lotteryId}`, { withAnchor: true });
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
          <Text style={styles.helper}>{t("participations.screen.loading")}</Text>
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t("participations.screen.error")}</Text>
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
          <Text style={styles.helper}>{t("participations.screen.empty")}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.lotteryId}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <ParticipationListRow
            participation={item}
            drawDateLabel={t("participations.list.drawOn", {
              date: item.drawAtLabel,
            })}
            ticketsLabel={t("participations.list.tickets", {
              count: item.userTicketsCount,
            })}
            onPress={() => openParticipation(item)}
            accessibilityLabel={t("participations.list.rowA11y", {
              title: item.title,
              count: item.userTicketsCount,
            })}
          />
        )}
        ListFooterComponent={
          hasNextPage ? (
            <View style={styles.footer}>
              <Button
                title={t("participations.list.loadMore")}
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
  separator: {
    height: theme.spacing.md,
  },
  footer: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
});
