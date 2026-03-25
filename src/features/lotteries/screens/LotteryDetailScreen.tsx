import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
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

import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { getI18nMessageForCode } from "@/src/lib/i18n/errorCodeMessage";
import { theme } from "@/src/theme";

import { useBuyTicketMutation } from "../hooks/useBuyTicketMutation";
import { useLotteryDetailQuery } from "../hooks/useLotteryDetailQuery";

export function LotteryDetailScreen() {
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams<{
    lotteryId?: string | string[];
  }>();
  const lotteryId = useMemo(() => {
    const raw = params.lotteryId;
    if (typeof raw === "string" && raw.length > 0) {
      return raw;
    }
    if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].length > 0) {
      return raw[0];
    }
    return undefined;
  }, [params.lotteryId]);

  const { data, isLoading, isError, refetch } =
    useLotteryDetailQuery(lotteryId);
  const { mutateAsync, isPending } = useBuyTicketMutation();
  const [buyError, setBuyError] = useState<string | null>(null);

  const onBuyTicket = async () => {
    if (!lotteryId) return;
    setBuyError(null);
    const result = await mutateAsync({ lotteryId });
    if (result.success) {
      await refetch();
      return;
    }

    if (result.kind === "business") {
      setBuyError(
        getI18nMessageForCode({
          t,
          i18n,
          baseKey: "lottery.detail.purchase.errors",
          code: result.errorCode,
          fallbackKey: "lottery.detail.purchase.errors.generic",
        }),
      );
      return;
    }

    setBuyError(t("lottery.detail.purchase.errors.generic"));
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
          <Text style={styles.helper}>{t("lottery.detail.loading")}</Text>
        </View>
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t("lottery.detail.error")}</Text>
          <Pressable style={styles.retryButton} onPress={() => void refetch()}>
            <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {data.image_url ? (
          <Image source={{ uri: data.image_url }} style={styles.image} />
        ) : null}
        <Text style={styles.title}>{data.title}</Text>
        {data.brand?.name ? (
          <Text style={styles.brand}>{data.brand.name}</Text>
        ) : null}
        <Text style={styles.status}>{data.statusLabel}</Text>

        <View style={styles.block}>
          <Text style={styles.meta}>{data.ticketCostLabel}</Text>
          <Text style={styles.meta}>{data.participantsLabel}</Text>
          <Text style={styles.meta}>{data.userTicketsLabel}</Text>
          <Text style={styles.meta}>{data.timeRemainingLabel}</Text>
        </View>

        {data.description ? (
          <Text style={styles.description}>{data.description}</Text>
        ) : null}

        {buyError ? <Text style={styles.buyError}>{buyError}</Text> : null}

        <Button
          title={
            isPending
              ? t("lottery.detail.buyingTicket")
              : t("lottery.detail.buyTicket")
          }
          onPress={() => void onBuyTicket()}
          disabled={isPending}
          style={styles.buyButton}
        />
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
  scroll: { flex: 1 },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
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
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  brand: {
    marginTop: theme.spacing.xs,
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  status: {
    marginTop: theme.spacing.sm,
    color: theme.colors.accentSolid,
    fontWeight: "600",
  },
  block: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  meta: {
    color: theme.colors.text,
    fontSize: 14,
  },
  description: {
    marginTop: theme.spacing.md,
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  buyError: {
    marginTop: theme.spacing.md,
    color: "#DC2626",
    fontSize: 14,
  },
  buyButton: {
    marginTop: theme.spacing.lg,
  },
});
