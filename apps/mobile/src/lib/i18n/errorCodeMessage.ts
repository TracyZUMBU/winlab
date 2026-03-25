import type { TFunction, i18n as I18nInstance } from "i18next";

type Params = {
  t: TFunction;
  i18n: I18nInstance;
  baseKey: string;
  code: string;
  fallbackKey: string;
};

/**
 * Maps a stable error code to an i18n message, with a required generic fallback.
 * Does not parse `error.message` and does not infer business meaning from text.
 */
export function getI18nMessageForCode({
  t,
  i18n,
  baseKey,
  code,
  fallbackKey,
}: Params): string {
  const key = `${baseKey}.${code}`;
  return i18n.exists(key) ? t(key) : t(fallbackKey);
}

