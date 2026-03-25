import type {
  Logger,
  LoggerTransport,
  LogMetadata,
  NormalizedError,
} from "./types";

function stringifySafe(value: unknown): string {
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeUnknownError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message || stringifySafe(error),
      stack: error.stack,
    };
  }

  return {
    message: stringifySafe(error),
  };
}

function buildArgs(message: string, metadata?: LogMetadata): unknown[] {
  const args: unknown[] = [message];
  if (metadata && Object.keys(metadata).length > 0) args.push(metadata);
  return args;
}

function buildErrorArgs(
  message: string,
  normalizedError?: NormalizedError,
  metadata?: LogMetadata,
): unknown[] {
  const args: unknown[] = [message];
  if (normalizedError) args.push(normalizedError);
  if (metadata && Object.keys(metadata).length > 0) args.push(metadata);
  return args;
}

function createConsoleTransport(): LoggerTransport {
  return {
    log: (message, metadata) => {
      console.log(...buildArgs(message, metadata));
    },
    info: (message, metadata) => {
      console.info(...buildArgs(message, metadata));
    },
    warn: (message, metadata) => {
      console.warn(...buildArgs(message, metadata));
    },
    error: (message, normalizedError, metadata) => {
      console.error(...buildErrorArgs(message, normalizedError, metadata));
    },
  };
}

export function createLogger(transports: LoggerTransport[]): Logger {
  return {
    log(message, metadata) {
      for (const transport of transports) {
        transport.log(message, metadata);
      }
    },
    info(message, metadata) {
      for (const transport of transports) {
        transport.info(message, metadata);
      }
    },
    warn(message, metadata) {
      for (const transport of transports) {
        transport.warn(message, metadata);
      }
    },
    error(message, error, metadata) {
      const normalizedError =
        typeof error !== "undefined" ? normalizeUnknownError(error) : undefined;

      for (const transport of transports) {
        transport.error(message, normalizedError, metadata);
      }
    },
  };
}

// Logger par défaut (MVP) : console uniquement.
const consoleTransport = createConsoleTransport();
export const logger: Logger = createLogger([consoleTransport]);
