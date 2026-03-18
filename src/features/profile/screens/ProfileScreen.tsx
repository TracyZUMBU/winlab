import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

import { Screen } from "@/src/components/ui/Screen";
import { signOut } from "@/src/features/auth/services/authService";
import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";
import { AUTH_ROUTES } from "@/src/features/auth/constants/authConstants";
import { Button } from "@/src/components/ui/Button";

export function ProfileScreen() {
  const router = useRouter();
  const { user, status } = useAuthSession();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.replace(AUTH_ROUTES.email);
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

