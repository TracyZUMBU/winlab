import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export function HomeScreen() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t("home.title")}</Text>
    </View>
  );
}
