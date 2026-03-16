import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

export function HomeScreen() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t("home.title")}</Text>
    </View>
  );
}
