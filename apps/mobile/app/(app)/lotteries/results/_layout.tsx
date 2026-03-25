import { Stack } from "expo-router";
import { t } from "i18next";

export default function LotteryResultsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: t("results.layout.listTitle") }}
      />
      <Stack.Screen
        name="[lotteryId]"
        options={{ title: t("results.layout.detailTitle") }}
      />
    </Stack>
  );
}
