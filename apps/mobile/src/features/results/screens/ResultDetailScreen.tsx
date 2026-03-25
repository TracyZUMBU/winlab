import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Screen } from "@/src/components/ui/Screen";
import { userFacingQueryLoadHint } from "@/src/lib/i18n/userFacingErrorHint";
import { theme } from "@/src/theme";

import { useLotteryResultDetailQuery } from "../hooks/useLotteryResultDetailQuery";

export function ResultDetailScreen() {
  const { t } = useTranslation();
  const { lotteryId } = useLocalSearchParams<{ lotteryId: string }>();
  const { data, isLoading, isError, isFetched, refetch } =
    useLotteryResultDetailQuery(lotteryId);

  if (!lotteryId) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.helper}>{t("results.detail.notFound")}</Text>
        </View>
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
          <Text style={styles.helper}>{t("results.detail.loading")}</Text>
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
          <Pressable style={styles.retryButton} onPress={() => void refetch()}>
            <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (isFetched && data === null) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.helper}>{t("results.detail.notFound")}</Text>
        </View>
      </Screen>
    );
  }

  if (!data) {
    return null;
  }

  const brandName = data.lottery.brand?.name ?? "";

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>{t("results.detail.lotterySection")}</Text>
        {data.lottery.image_url ? (
          <Image
            source={{ uri: data.lottery.image_url }}
            style={styles.image}
          />
        ) : null}
        <Text style={styles.title}>{data.lottery.title}</Text>
        {brandName ? <Text style={styles.meta}>{brandName}</Text> : null}
        <Text style={styles.meta}>{data.lottery.drawAtLabel}</Text>

        <Text style={styles.sectionTitle}>{t("results.detail.userSection")}</Text>
        <Text style={styles.meta}>{data.ticketsLabel}</Text>
        <Text style={styles.meta}>{data.userResultStatusLabel}</Text>
        {data.winnerPosition != null ? (
          <Text style={styles.meta}>
            {t("results.list.winnerPosition", { position: data.winnerPosition })}
          </Text>
        ) : null}

        <Text style={styles.sectionTitle}>{t("results.detail.winnersSection")}</Text>
        {data.winners.map((w) => (
          <View key={w.position} style={styles.winnerRow}>
            <Text style={styles.meta}>
              {t("results.detail.winnerLine", {
                position: w.position,
                pseudo: w.maskedUsername,
              })}
            </Text>
          </View>
        ))}
      </ScrollView>
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
  scroll: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    marginTop: theme.spacing.md,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  winnerRow: {
    paddingVertical: theme.spacing.xs,
  },
});
