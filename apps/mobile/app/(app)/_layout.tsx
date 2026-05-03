import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { AUTH_ROUTES } from "@/src/features/auth/constants/authConstants";
import { useAppBootstrap } from "@/src/lib/bootstrap/useAppBootstrap";
import { theme } from "@/src/theme";

export default function AppLayout() {
  const router = useRouter();
  const { status, sessionUserId, profile, hasSeenOnboarding } =
    useAppBootstrap(true);

  useEffect(() => {
    if (status !== "ready") return;

    // guard: "(app)" requires a session + a profile.
    if (!sessionUserId) {
      router.replace(hasSeenOnboarding ? AUTH_ROUTES.email : "/onboarding");
      return;
    }

    if (!profile) {
      router.replace(AUTH_ROUTES.createProfile);
    }
  }, [status, sessionUserId, profile, hasSeenOnboarding, router]);

  if (status !== "ready") {
    // avoid a flash UI during the bootstrap.
    return null;
  }

  // Ne pas monter les écrans d’onglets tant que la garde n’a pas validé session + profil
  // (sinon un tab peut planter avant le `router.replace`, et l’erreur remonte de façon opaque).
  if (!sessionUserId || !profile) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accentSolid,
        tabBarInactiveTintColor: theme.colors.textMutedAccent,
        tabBarStyle: {
          borderTopColor: theme.colors.borderSubtle,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: "Missions",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="flag" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="lotteries"
        options={{
          title: "Lotteries",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="casino" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ focused, color, size }) =>
            focused ? (
              <View style={styles.walletTabIconFocused}>
                <MaterialIcons
                  name="account-balance-wallet"
                  color={theme.colors.text}
                  size={size}
                />
              </View>
            ) : (
              <MaterialIcons
                name="account-balance-wallet"
                color={color}
                size={size}
              />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="referral"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  walletTabIconFocused: {
    marginTop: -12,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSolid,
    shadowColor: theme.colors.accentSolid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
