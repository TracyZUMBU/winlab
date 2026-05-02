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
  View,
} from "react-native";

import { logger } from "@/src/lib/logger";
import { theme } from "@/src/theme";

import { resolveVideoSource } from "../video/resolveVideoSource";

/** Au-delà de ce décalage en une mise à jour, on considère un saut manuel (scrub) et on revient au max légitime. */
const SEEK_JUMP_TOLERANCE_SECONDS = 2.5;

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

  onCompleteRef.current = onComplete;
  onProgressRef.current = onProgress;

  const [isPlaying, setIsPlaying] = useState(false);

  const player = useVideoPlayer(expoSource, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 1;
    p.playbackRate = 1;
  });

  useEffect(() => {
    maxLegitimateTimeRef.current = 0;
  }, [videoUrl]);

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
      logger.warn("MissionVideoPlayer playback error", { videoUrl });
    }
  });

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
    try {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch {
      /* noop */
    }
  }, [player]);

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
});
