import type { TFunction, i18n as I18nInstance } from "i18next";

/**
 * Visual variants mapped to custom toast types in `react-native-toast-message` config.
 * Keep in sync with `toast.config.tsx`.
 */
export type ToastVariant = "success" | "error" | "info" | "warning";

/** Internal keys used only by the toast layer (not for i18n). */
export const WINLAB_TOAST_TYPES = {
  success: "winlab_success",
  error: "winlab_error",
  info: "winlab_info",
  warning: "winlab_warning",
} as const satisfies Record<ToastVariant, string>;

export type WinlabToastType =
  (typeof WINLAB_TOAST_TYPES)[ToastVariant];

export type ShowToastInput = {
  type: ToastVariant;
  /** Primary line (title or single-line message). */
  title: string;
  /** Secondary line; omit for a compact single-line toast. */
  message?: string;
  durationMs?: number;
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
