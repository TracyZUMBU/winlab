import { Stack } from "expo-router";
import { t } from "i18next";

export default function LotteriesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        title: "Lotteries",
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: t("lotteries.layout.title") }}
      />
      <Stack.Screen
        name="[lotteryId]"
        options={{ title: t("lotteries.layout.detail") }}
      />
      <Stack.Screen
        name="all"
        options={{ title: t("lotteries.layout.catalog") }}
      />
      <Stack.Screen
        name="results"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
