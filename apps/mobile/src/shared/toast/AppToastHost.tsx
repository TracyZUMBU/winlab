import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { winlabToastConfig } from "./toast.config";

/**
 * Renders the global toast host. Mount once at app root (next to navigation).
 */
export function AppToastHost() {
  const insets = useSafeAreaInsets();

  return (
    <Toast
      config={winlabToastConfig}
      topOffset={Math.max(insets.top, 12) + 4}
      bottomOffset={Math.max(insets.bottom, 12) + 8}
    />
  );
}
