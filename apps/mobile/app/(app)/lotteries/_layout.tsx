import { Stack } from "expo-router";
import { t } from "i18next";

export default function LotteriesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
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
    </Stack>
  );
}
