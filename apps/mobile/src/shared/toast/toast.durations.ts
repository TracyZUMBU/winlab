import type { ToastVariant } from "./toast.types";

/** Default visibility durations per variant (milliseconds). */
export const DEFAULT_TOAST_DURATION_MS: Record<ToastVariant, number> = {
  success: 2600,
  error: 4200,
  info: 3200,
  warning: 3600,
};
