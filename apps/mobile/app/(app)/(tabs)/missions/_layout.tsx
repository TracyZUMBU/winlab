import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

/** Requis pour les deep links / `withAnchor` quand un stack vit dans un onglet (cf. doc Expo « Stacks inside tabs »). */
export const unstable_settings = {
  initialRouteName: "index",
};

export default function MissionsLayout() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        title: t("missions.layout.title"),
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
