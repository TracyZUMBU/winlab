import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuthSession } from "../../auth/hooks/useAuthSession";

export function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuthSession();
  console.log("user:", user);

  return (
    <View>
      <Text>{t("home.title")}</Text>
    </View>
  );
}
