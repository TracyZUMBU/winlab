import { logger } from "@/src/lib/logger";

import type { MonitoringEvent } from "../types";
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

export class ConsoleMonitoringProvider implements MonitoringProvider {
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
      logger.log(prefix, metadata);
      return;
    }

    logger.warn(prefix, metadata);
  }
}

