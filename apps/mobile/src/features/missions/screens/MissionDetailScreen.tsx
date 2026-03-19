import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Screen } from "@/src/components/ui/Screen";
import { theme } from "@/src/theme";
import { useGetMissionByIdQuery } from "../hooks/useGetMissionByIdQuery";

export function MissionDetailScreen() {
  const { missionId } = useLocalSearchParams<{ missionId: string }>();
  const {
    data: mission,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetMissionByIdQuery(missionId);

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accentSolid} />
          <Text style={styles.muted}>Chargement…</Text>
        </View>
      </Screen>
    );
  }

  if (isError || !mission) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.error}>
            {missionId
              ? "Cette mission est introuvable ou une erreur est survenue."
              : "Mission non précisée."}
          </Text>
          {error instanceof Error ? (
            <Text style={styles.muted}>{error.message}</Text>
          ) : null}
          {missionId ? (
            <Pressable style={styles.retry} onPress={() => refetch()}>
              <Text style={styles.retryText}>Réessayer</Text>
            </Pressable>
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{mission.title}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{mission.mission_type}</Text>
          <Text style={styles.metaText}>•</Text>
          <Text style={styles.tokenReward}>{mission.token_reward} tokens</Text>
        </View>
        {mission.starts_at ? (
          <Text style={styles.muted}>
            Début : {formatDate(mission.starts_at)}
          </Text>
        ) : null}
        {mission.ends_at ? (
          <Text style={styles.muted}>Fin : {formatDate(mission.ends_at)}</Text>
        ) : null}
        {mission.description ? (
          <Text style={styles.description}>{mission.description}</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function formatDate(iso: string): string {
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) {
      return iso;
    }
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  metaText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  tokenReward: {
    fontSize: 14,
    color: theme.colors.accentSolid,
    fontWeight: "600",
  },
  muted: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
    marginTop: theme.spacing.md,
  },
  error: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: "center",
  },
  retry: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.accentSolid,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
});
