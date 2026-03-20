import { logger } from "@/src/lib/logger";

import type {
  MonitoringError,
  MonitoringEvent,
  MonitoringSeverity,
  MonitoringMessageEvent,
  MonitoringExceptionEvent,
} from "./types";
import type { MonitoringProvider } from "./providers/monitoring-provider";
import { normalizeError } from "./normalize-error";
import { sanitizeMonitoringEvent } from "./sanitize-monitoring-event";

export type CaptureMessageInput = Omit<
  MonitoringMessageEvent,
  "type" | "timestamp" | "environment" | "service"
> & { type?: "message" };

export type CaptureExceptionInput = Omit<
  MonitoringExceptionEvent,
  "type" | "timestamp" | "environment" | "service" | "message" | "error"
> & {
  error: unknown;
  message?: string;
  type?: "exception";
};

export type MonitoringServiceOptions = {
  environment: string;
  service: string;
  providers: MonitoringProvider[];
};

function ensureNonEmptyString(value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  return String(value ?? "");
}

export class MonitoringService {
  private readonly environment: string;
  private readonly service: string;
  private readonly providers: MonitoringProvider[];

  constructor(options: MonitoringServiceOptions) {
    this.environment = options.environment;
    this.service = options.service;
    this.providers = options.providers;
  }

  private async dispatch(event: MonitoringEvent): Promise<void> {
    if (this.providers.length === 0) return;

    // TODO: enforce monitoring retention policy at the storage layer
    // (e.g. Slack edge function persistence, Sentry configuration, etc.).

    // Never break the business flow because of monitoring.
    const sanitizedEvent = await sanitizeMonitoringEvent(event);
    const results = await Promise.allSettled(
      this.providers.map((provider) => provider.capture(sanitizedEvent)),
    );

    for (const result of results) {
      if (result.status !== "rejected") continue;

      const message = ensureNonEmptyString(result.reason);
      logger.warn("[monitoring] Provider dispatch failed", {
        error: message,
      });
    }
  }

  public captureMessage(input: CaptureMessageInput): void {
    const event: MonitoringMessageEvent = {
      type: "message",
      name: input.name,
      message: input.message,
      severity: input.severity,
      timestamp: Date.now(),
      environment: this.environment,
      service: this.service,
      feature: input.feature,
      userId: input.userId,
      requestId: input.requestId,
      tags: input.tags,
      extra: input.extra,
    };

    // Best-effort: we never report the failure back to the business.
    void this.dispatch(event).catch(() => {});
  }

  public captureException(input: CaptureExceptionInput): void {
    const normalizedError: MonitoringError = normalizeError(input.error);
    const eventMessage =
      input.message ?? normalizedError.message ?? normalizedError.name ?? "";

    const event: MonitoringExceptionEvent = {
      type: "exception",
      name: input.name,
      message: eventMessage,
      severity: input.severity,
      timestamp: Date.now(),
      environment: this.environment,
      service: this.service,
      feature: input.feature,
      userId: input.userId,
      requestId: input.requestId,
      tags: input.tags,
      extra: input.extra,
      error: {
        name: normalizedError.name,
        message: normalizedError.message,
        stack: normalizedError.stack,
      },
    };

    // Best-effort: we never report the failure back to the business.
    void this.dispatch(event).catch(() => {});
  }
}

export function toSeverityOrFallback(
  severity: MonitoringSeverity | undefined,
): MonitoringSeverity {
  return severity ?? "warning";
}
