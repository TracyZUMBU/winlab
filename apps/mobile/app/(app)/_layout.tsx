import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";

import { AUTH_ROUTES } from "@/src/features/auth/constants/authConstants";
import { useAppBootstrap } from "@/src/lib/bootstrap/useAppBootstrap";
import { theme } from "@/src/theme";

export default function AppTabsLayout() {
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
          tabBarIcon: ({ color, size }) => (
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
    </Tabs>
  );
}
