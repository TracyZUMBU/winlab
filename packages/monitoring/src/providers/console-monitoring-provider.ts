import type { MonitoringError, MonitoringEvent } from "../types";
import type { MonitoringProvider } from "./monitoring-provider";

function formatEventForConsole(event: MonitoringEvent): string {
  return [
    `[${event.severity.toUpperCase()}] ${event.type}:${event.name}`,
    `env=${event.environment}`,
    `service=${event.service}`,
    event.feature ? `feature=${event.feature}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

export type MonitoringConsoleSink = {
  log: (message: string, metadata?: Record<string, unknown>) => void;
  warn: (message: string, metadata?: Record<string, unknown>) => void;
  error: (
    message: string,
    error?: MonitoringError,
    metadata?: Record<string, unknown>,
  ) => void;
};

function defaultConsoleSink(): MonitoringConsoleSink {
  return {
    log: (message, metadata) => {
      if (metadata && Object.keys(metadata).length > 0) {
        console.log(message, metadata);
      } else {
        console.log(message);
      }
    },
    warn: (message, metadata) => {
      if (metadata && Object.keys(metadata).length > 0) {
        console.warn(message, metadata);
      } else {
        console.warn(message);
      }
    },
    error: (message, error, metadata) => {
      const args: unknown[] = [message];
      if (error !== undefined) args.push(error);
      if (metadata && Object.keys(metadata).length > 0) args.push(metadata);
      console.error(...args);
    },
  };
}

export type ConsoleMonitoringProviderOptions = {
  /** Override output (e.g. app logger). Defaults to global `console`. */
  sink?: Partial<MonitoringConsoleSink>;
};

export class ConsoleMonitoringProvider implements MonitoringProvider {
  private readonly sink: MonitoringConsoleSink;

  constructor(options: ConsoleMonitoringProviderOptions = {}) {
    const base = defaultConsoleSink();
    this.sink = {
      log: options.sink?.log ?? base.log,
      warn: options.sink?.warn ?? base.warn,
      error: options.sink?.error ?? base.error,
    };
  }

  public async capture(event: MonitoringEvent): Promise<void> {
    const prefix = formatEventForConsole(event);
    const metadata = {
      message: event.message,
      userId: event.userId,
      requestId: event.requestId,
      tags: event.tags,
      extra: event.extra,
      error: event.type === "exception" ? event.error : undefined,
      timestamp: new Date(event.timestamp).toISOString(),
    };

    if (event.severity === "debug" || event.severity === "info") {
      this.sink.log(prefix, metadata);
      return;
    }

    if (event.severity === "error" || event.severity === "critical") {
      this.sink.error(
        prefix,
        event.type === "exception" ? event.error : undefined,
        metadata,
      );
      return;
    }

    this.sink.warn(prefix, metadata);
  }
}
