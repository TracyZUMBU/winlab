import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/theme";

import type { MissionVideoPlayerProps } from "../../components/MissionVideoPlayer";
import { CommonMissionDetailSection } from "./CommonMissionDetailSection";
import type { MissionTypeDetailRendererProps } from "./types";

const MissionVideoPlayerLoadable = lazy(() =>
  import("../../components/MissionVideoPlayer")
    .then((m) => ({ default: m.MissionVideoPlayer }))
    .catch(() => ({
      default: function MissionVideoPlayerUnavailable(
        _props: MissionVideoPlayerProps,
      ) {
        const { t } = useTranslation();
        return (
          <View style={styles.nativeMissingBox}>
            <Text style={styles.nativeMissingText}>
              {t("missions.detail.video.nativeModuleUnavailable")}
            </Text>
          </View>
        );
      },
    })),
);

function VideoMissionDetail({
  mission,
  video,
}: MissionTypeDetailRendererProps) {
  const { t } = useTranslation();

  return (
    <>
      <CommonMissionDetailSection mission={mission} />

      {!video ? (
        <View style={styles.videoSection}>
          <Text style={styles.configError}>
            {t("missions.detail.video.configError")}
          </Text>
        </View>
      ) : (
        <View style={styles.videoSection}>
          <Text style={styles.videoTitle}>{video.displayTitle}</Text>
          {/* {video.thumbnailUrl ? (
            <Image
              source={{ uri: video.thumbnailUrl }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              accessibilityIgnoresInvertColors
            />
          ) : null} */}

          {video.isCompleted ? (
            <Text style={styles.completedBanner}>
              {t("missions.detail.video.completedState")}
            </Text>
          ) : null}

          {!video.isCompleted ? (
            <Suspense
              fallback={
                <View style={styles.playerFallback}>
                  <ActivityIndicator color={theme.colors.accentSolid} />
                </View>
              }
            >
              <MissionVideoPlayerLoadable
                videoUrl={video.videoUrl}
                onComplete={video.onVideoComplete}
              />
            </Suspense>
          ) : null}
        </View>
      )}
    </>
  );
}

export { VideoMissionDetail };
export default VideoMissionDetail;

const styles = StyleSheet.create({
  videoSection: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  videoTitle: {
    ...theme.typography.cardTitle,
    color: theme.colors.text,
  },
  thumbnail: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.borderSubtle,
  },
  completedBanner: {
    ...theme.typography.cardTitle,
    color: theme.colors.accentSolid,
    textAlign: "center",
  },
  configError: {
    ...theme.typography.body,
    color: theme.colors.dangerSolid,
    textAlign: "center",
  },
  playerFallback: {
    width: "100%",
    aspectRatio: 16 / 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.backgroundDark,
  },
  nativeMissingBox: {
    width: "100%",
    aspectRatio: 16 / 9,
    padding: theme.spacing.md,
    justifyContent: "center",
    backgroundColor: theme.colors.backgroundDark,
    borderRadius: theme.radius.md,
  },
  nativeMissingText: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
});
