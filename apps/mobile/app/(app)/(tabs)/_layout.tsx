import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { ParamListBase } from "@react-navigation/native";
import { Tabs, router } from "expo-router";

import { theme } from "@/src/theme";
import { useTranslation } from "react-i18next";

const TAB_ROOT_PATHS = {
  missions: "/missions",
  lotteries: "/lotteries",
} as const;

type TabWithStack = keyof typeof TAB_ROOT_PATHS;

function isTabStackAtRoot(nestedState: unknown): boolean {
  if (
    !nestedState ||
    typeof nestedState !== "object" ||
    !("routes" in nestedState) ||
    !Array.isArray(nestedState.routes) ||
    nestedState.routes.length === 0
  ) {
    return true;
  }

  const currentIndex =
    "index" in nestedState && typeof nestedState.index === "number"
      ? nestedState.index
      : 0;
  const currentRoute = nestedState.routes[currentIndex] as
    | { name?: string }
    | undefined;

  return currentIndex === 0 && currentRoute?.name === "index";
}

function getTabStackResetListeners(tabName: TabWithStack) {
  const rootPath = TAB_ROOT_PATHS[tabName];

  return ({
    navigation,
  }: {
    navigation: BottomTabNavigationProp<ParamListBase>;
  }) => ({
    tabPress: () => {
      const state = navigation.getState();
      const tabRoute = state.routes.find((route) => route.name === tabName);
      const nestedState = tabRoute?.state;

      if (!isTabStackAtRoot(nestedState)) {
        router.navigate(rootPath);
      }
    },
  });
}

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          borderTopColor: theme.colors.borderSubtle,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="missions"
        listeners={getTabStackResetListeners("missions")}
        options={{
          title: t("tabs.missions"),
          popToTopOnBlur: true,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="flag" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="lotteries"
        listeners={getTabStackResetListeners("lotteries")}
        options={{
          title: t("tabs.lotteries"),
          popToTopOnBlur: true,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="casino" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: t("tabs.wallet"),
          tabBarIcon: ({ focused, color, size }) => (
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
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
