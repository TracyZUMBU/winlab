export type LogMetadata = Record<string, unknown>;

export interface NormalizedError {
  name?: string;
  message: string;
  stack?: string;
}

export interface Logger {
  log(message: string, metadata?: LogMetadata): void;
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  /**
   * @param error - accepte `unknown` pour forcer une normalisation côté logger
   * @param metadata - infos additionnelles (optionnel)
   */
  error(message: string, error?: unknown, metadata?: LogMetadata): void;
}

export interface LoggerTransport {
  log: (message: string, metadata?: LogMetadata) => void;
  info: (message: string, metadata?: LogMetadata) => void;
  warn: (message: string, metadata?: LogMetadata) => void;
  error: (
    message: string,
    normalizedError?: NormalizedError,
    metadata?: LogMetadata,
  ) => void;
}
