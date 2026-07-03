import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEventListener } from "expo";
import { useFocusEffect } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AppState,
  type AppStateStatus,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { logger } from "@/src/lib/logger";
import { theme } from "@/src/theme";

import { resolveVideoSource } from "../video/resolveVideoSource";
import { isVideoBlockedOnPlatform } from "../video/videoCodecSupport";

/** Au-delà de ce décalage en une mise à jour, on considère un saut manuel (scrub) et on revient au max légitime. */
const SEEK_JUMP_TOLERANCE_SECONDS = 2.5;
/** Délai avant de considérer que la lecture est bloquée (métadonnées OK mais pas d'images). */
const PLAYBACK_STALL_TIMEOUT_MS = 4_000;

export type MissionVideoPlayerProps = {
  videoUrl: string;
  onComplete: () => void;
  onProgress?: (seconds: number) => void;
};

function MissionVideoPlayerInner({
  videoUrl,
  onComplete,
  onProgress,
}: MissionVideoPlayerProps) {
  const { t } = useTranslation();
  const expoSource = resolveVideoSource(videoUrl);
  const onCompleteRef = useRef(onComplete);
  const onProgressRef = useRef(onProgress);
  const maxLegitimateTimeRef = useRef(0);
  const playRequestedAtRef = useRef<number | null>(null);

  onCompleteRef.current = onComplete;
  onProgressRef.current = onProgress;

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState<
    "unsupported_codec" | "playback_stalled" | null
  >(null);

  const blockedOnPlatform = isVideoBlockedOnPlatform(videoUrl);

  useEffect(() => {
    if (blockedOnPlatform) {
      setPlaybackError("unsupported_codec");
    }
  }, [blockedOnPlatform]);

  const player = useVideoPlayer(blockedOnPlatform ? null : expoSource, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 1;
    p.playbackRate = 1;
  });

  useEffect(() => {
    maxLegitimateTimeRef.current = 0;
    playRequestedAtRef.current = null;
    if (!blockedOnPlatform) {
      setPlaybackError(null);
    }
  }, [videoUrl, blockedOnPlatform]);

  useEventListener(player, "playToEnd", () => {
    onCompleteRef.current();
  });

  useEventListener(player, "playingChange", ({ isPlaying: playing }) => {
    setIsPlaying(playing);
  });

  useEventListener(player, "playbackRateChange", ({ playbackRate }) => {
    if (playbackRate !== 1) {
      try {
        player.playbackRate = 1;
      } catch {
        /* noop */
      }
    }
  });

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    if (currentTime > 0.25) {
      playRequestedAtRef.current = null;
    }

    const maxT = maxLegitimateTimeRef.current;
    if (currentTime > maxT + SEEK_JUMP_TOLERANCE_SECONDS) {
      try {
        player.currentTime = maxT;
      } catch {
        /* noop */
      }
      onProgressRef.current?.(maxT);
      return;
    }
    if (currentTime >= maxT) {
      maxLegitimateTimeRef.current = Math.max(maxT, currentTime);
    }
    onProgressRef.current?.(currentTime);
  });

  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "error") {
      try {
        player.pause();
      } catch {
        /* noop — évite tout crash si le player est déjà libéré */
      }
      setPlaybackError("playback_stalled");
      logger.warn("MissionVideoPlayer playback error", { videoUrl });
    }
  });

  useEffect(() => {
    if (blockedOnPlatform || !isPlaying) return;

    const interval = setInterval(() => {
      const startedAt = playRequestedAtRef.current;
      if (startedAt == null) return;
      if (Date.now() - startedAt < PLAYBACK_STALL_TIMEOUT_MS) return;
      if (maxLegitimateTimeRef.current > 0.25) {
        playRequestedAtRef.current = null;
        return;
      }

      try {
        player.pause();
      } catch {
        /* noop */
      }
      setPlaybackError("playback_stalled");
    }, 500);

    return () => clearInterval(interval);
  }, [blockedOnPlatform, isPlaying, player]);

  useEffect(() => {
    const onAppState = (state: AppStateStatus) => {
      if (state !== "active") {
        try {
          player.pause();
        } catch {
          /* noop */
        }
      }
    };

    const sub = AppState.addEventListener("change", onAppState);
    return () => sub.remove();
  }, [player]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        try {
          player.pause();
        } catch {
          /* noop */
        }
      };
    }, [player]),
  );

  const togglePlayPause = useCallback(() => {
    if (playbackError === "unsupported_codec") return;

    try {
      if (player.playing) {
        player.pause();
        playRequestedAtRef.current = null;
      } else {
        setPlaybackError(null);
        playRequestedAtRef.current = Date.now();
        player.play();
      }
    } catch {
      setPlaybackError("playback_stalled");
    }
  }, [player, playbackError]);

  if (playbackError != null) {
    const messageKey =
      playbackError === "unsupported_codec"
        ? "missions.detail.video.unsupportedCodecIos"
        : "missions.detail.video.playbackStalled";

    return (
      <View style={styles.shell}>
        <View style={styles.errorBox}>
          <MaterialIcons
            name="error-outline"
            size={40}
            color={theme.colors.dangerSolid}
          />
          <Text style={styles.errorText}>{t(messageKey)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <VideoView
        style={styles.video}
        player={player}
        nativeControls={false}
        contentFit="contain"
        requiresLinearPlayback
        allowsFullscreen={false}
        fullscreenOptions={{ enable: false }}
        allowsPictureInPicture={false}
        showsTimecodes={false}
      />
      <Pressable
        style={styles.controlsOverlay}
        onPress={togglePlayPause}
        accessibilityRole="button"
        accessibilityLabel={
          isPlaying
            ? t("missions.detail.video.playerAccessibilityPause")
            : t("missions.detail.video.playerAccessibilityPlay")
        }
      >
        {!isPlaying ? (
          <View style={styles.playIconCircle} pointerEvents="none">
            <MaterialIcons
              name="play-arrow"
              size={56}
              color={theme.colors.text}
            />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

export function MissionVideoPlayer(props: MissionVideoPlayerProps) {
  if (!props.videoUrl.trim()) {
    return <View style={styles.shell} />;
  }

  return <MissionVideoPlayerInner {...props} />;
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    aspectRatio: 16 / 9,
    alignSelf: "stretch",
    backgroundColor: theme.colors.backgroundDark,
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 6,
  },
  errorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.dangerSolid,
    textAlign: "center",
  },
});
