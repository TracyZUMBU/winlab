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
  debug(message: string, metadata?: LogMetadata): void;
  /**
   ‡* @param error - accepts `unknown` to force normalization within the logger
   * @param metadata - additional information (optional)
   */
  error(message: string, error?: unknown, metadata?: LogMetadata): void;
}

export interface LoggerTransport {
  log: (message: string, metadata?: LogMetadata) => void;
  info: (message: string, metadata?: LogMetadata) => void;
  warn: (message: string, metadata?: LogMetadata) => void;
  debug: (message: string, metadata?: LogMetadata) => void;
  error: (
    message: string,
    normalizedError?: NormalizedError,
    metadata?: LogMetadata,
  ) => void;
}
