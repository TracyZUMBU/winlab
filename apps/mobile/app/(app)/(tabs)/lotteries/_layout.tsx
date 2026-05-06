import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function LotteriesLayout() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        title: t("tabs.lotteries"),
      }}
    >
      s
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
    </Stack>
  );
}
