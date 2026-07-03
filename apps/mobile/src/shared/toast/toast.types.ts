import type { TFunction, i18n as I18nInstance } from "i18next";

/**
 * Visual variants mapped to custom toast types in `react-native-toast-message` config.
 * Keep in sync with `toast.config.tsx`.
 */
export type ToastVariant = "success" | "error" | "info" | "warning";

/** Internal keys used only by the toast layer (not for i18n). */
export const WINTIX_TOAST_TYPES = {
  success: "wintix_success",
  error: "wintix_error",
  info: "wintix_info",
  warning: "wintix_warning",
} as const satisfies Record<ToastVariant, string>;

export type WintixToastType =
  (typeof WINTIX_TOAST_TYPES)[ToastVariant];

export type ShowToastInput = {
  type: ToastVariant;
  /** Primary line (title or single-line message). */
  title: string;
  /** Secondary line; omit for a compact single-line toast. */
  message?: string;
  durationMs?: number;
  /**
   * When false, the toast stays until the user dismisses it (tap / swipe per library behavior).
   * Default true.
   */
  autoHide?: boolean;
  /**
   * Reserved for future analytics (no-op today).
   * Do not log PII.
   */
  trackingEventName?: string;
};

export type ShowToastForBusinessErrorCodeParams = {
  t: TFunction;
  i18n: I18nInstance;
  baseKey: string;
  code: string;
  fallbackKey: string;
  /** When set, shown as `title` with the mapped message as `message`. */
  errorTitle?: string;
};
