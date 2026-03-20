/**
 * Détection centralisée de l'environnement.
 *
 * En React Native / Expo, `__DEV__` est le repère le plus fiable.
 */
declare const __DEV__: boolean | undefined;

export function isDevelopmentEnvironment(): boolean {
  if (typeof __DEV__ !== "undefined") {
    return Boolean(__DEV__);
  }

  const nodeEnv =
    typeof process !== "undefined" ? process.env?.NODE_ENV : undefined;
  return nodeEnv !== "production";
}

