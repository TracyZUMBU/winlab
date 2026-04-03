import { getI18nMessageForCode } from "@/src/lib/i18n/errorCodeMessage";

import { showErrorToast } from "./toastService";
import type { ShowToastForBusinessErrorCodeParams } from "./toast.types";

/**
 * Maps a stable business error code to an i18n string, then shows an error toast.
 * Does not parse raw `Error#message`.
 */
export function showToastForBusinessErrorCode(
  params: ShowToastForBusinessErrorCodeParams,
): void {
  const message = getI18nMessageForCode({
    t: params.t,
    i18n: params.i18n,
    baseKey: params.baseKey,
    code: params.code,
    fallbackKey: params.fallbackKey,
  });

  if (params.errorTitle) {
    showErrorToast({
      title: params.errorTitle,
      message,
    });
    return;
  }

  showErrorToast({ title: message });
}
