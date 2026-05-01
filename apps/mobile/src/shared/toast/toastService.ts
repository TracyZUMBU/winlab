import Toast from "react-native-toast-message";

import { DEFAULT_TOAST_DURATION_MS } from "./toast.durations";
import {
  WINLAB_TOAST_TYPES,
  type ShowToastInput,
  type ToastVariant,
} from "./toast.types";

let lastDedupeKey = "";
let lastDedupeAtMs = 0;

const DEDUPE_WINDOW_MS = 2000;

function dedupeKey(
  variant: ToastVariant,
  title: string,
  message?: string,
): string {
  return `${variant}\0${title}\0${message ?? ""}`;
}

function shouldSkipDuplicate(key: string): boolean {
  const now = Date.now();
  if (key === lastDedupeKey && now - lastDedupeAtMs < DEDUPE_WINDOW_MS) {
    return true;
  }
  lastDedupeKey = key;
  lastDedupeAtMs = now;
  return false;
}

/**
 * Low-level toast. Prefer `showSuccessToast` / `showErrorToast` / … in UI code.
 */
export function showToast(input: ShowToastInput): void {
  const key = dedupeKey(input.type, input.title, input.message);
  if (shouldSkipDuplicate(key)) {
    return;
  }

  if (input.trackingEventName) {
    // TODO: Integrate with your analytics service
    // analytics.track(input.trackingEventName, { type: input.type });
  }

  const libType = WINLAB_TOAST_TYPES[input.type];
  const visibilityTime =
    input.durationMs ?? DEFAULT_TOAST_DURATION_MS[input.type];

  Toast.show({
    type: libType,
    text1: input.title,
    text2: input.message,
    position: "top",
    visibilityTime,
    autoHide: input.autoHide !== false,
  });
}

export function showSuccessToast(
  input: Omit<ShowToastInput, "type"> & { title: string },
): void {
  const { title, message, durationMs, autoHide, trackingEventName } = input;
  showToast({
    type: "success",
    title,
    message,
    durationMs,
    autoHide,
    trackingEventName,
  });
}

export function showErrorToast(
  input: Omit<ShowToastInput, "type"> & { title: string },
): void {
  const { title, message, durationMs, autoHide, trackingEventName } = input;
  showToast({
    type: "error",
    title,
    message,
    durationMs,
    autoHide,
    trackingEventName,
  });
}

export function showInfoToast(
  input: Omit<ShowToastInput, "type"> & { title: string },
): void {
  const { title, message, durationMs, autoHide, trackingEventName } = input;
  showToast({
    type: "info",
    title,
    message,
    durationMs,
    autoHide,
    trackingEventName,
  });
}

export function showWarningToast(
  input: Omit<ShowToastInput, "type"> & { title: string },
): void {
  const { title, message, durationMs, autoHide, trackingEventName } = input;
  showToast({
    type: "warning",
    title,
    message,
    durationMs,
    autoHide,
    trackingEventName,
  });
}

export function hideToast(): void {
  Toast.hide();
}
