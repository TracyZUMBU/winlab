import Toast from "react-native-toast-message";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { winlabToastConfig } from "./toast.config";

/**
 * Renders the global toast host. Mount once at app root (next to navigation).
 *
 * The library’s internal container does not set z-index; wrapping in a full-screen
 * `box-none` layer keeps toasts above tabs / headers while preserving touch passthrough.
 */
export function AppToastHost() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.overlayHost} pointerEvents="box-none">
      <Toast
        config={winlabToastConfig}
        topOffset={Math.max(insets.top, 12) + 4}
        bottomOffset={Math.max(insets.bottom, 12) + 8}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlayHost: {
    ...StyleSheet.absoluteFillObject,
    // Above tab bar / stack chrome (typical elevation ~8); avoid absurd values that some OEMs clamp.
    zIndex: 50_000,
    elevation: 32,
  },
});
