import { Image, StyleSheet, View } from "react-native";

export const SplashLogo = () => {
  return (
    <View style={styles.container}>
      {/* Placeholder logo – replace with real asset later */}
      <Image
        source={require("../../../../assets/icon.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 24,
  },
});
