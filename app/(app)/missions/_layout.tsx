import { Stack } from "expo-router";
import { t } from "i18next";

export default function MissionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: "Missions",
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: t("missions.layout.title") }}
      />
      <Stack.Screen
        name="[missionId]"
        options={{ title: t("missions.layout.detail") }}
      />
    </Stack>
  );
}
