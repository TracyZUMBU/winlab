import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { StackNavigationHeader } from "@/src/components/navigation/StackNavigationHeader";

export default function ParticipationsLayout() {
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
        options={{ title: t("participations.layout.listTitle") }}
      />
    </Stack>
  );
}
