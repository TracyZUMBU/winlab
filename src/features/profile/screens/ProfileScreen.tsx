import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { Screen } from "@/src/components/ui/Screen";
import { AUTH_ROUTES } from "@/src/features/auth/constants/authConstants";
import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";
import { signOut } from "@/src/features/auth/services";
import { logger } from "@/src/lib/logger";

export function ProfileScreen() {
  const router = useRouter();
  const { user, status } = useAuthSession();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.replace(AUTH_ROUTES.email);
    } catch (error) {
      // Consider using a toast or alert to inform the user
      logger.error("Logout failed", error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Screen>
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Profile</Text>
        {status === "loading" ? (
          <Text>Chargement...</Text>
        ) : (
          <>
            <Text>Email: {user?.email ?? "Inconnu"}</Text>
            <Button
              title={loggingOut ? "Déconnexion..." : "Se déconnecter"}
              onPress={handleLogout}
              disabled={loggingOut}
              variant="primary"
            />
          </>
        )}
      </View>
    </Screen>
  );
}
