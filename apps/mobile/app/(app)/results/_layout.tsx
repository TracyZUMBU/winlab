import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { StackNavigationHeader } from "@/src/components/navigation/StackNavigationHeader";

export default function ResultsLayout() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        header: (props) => <StackNavigationHeader {...props} />,
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
