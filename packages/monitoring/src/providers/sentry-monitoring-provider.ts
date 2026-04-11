import type { MonitoringEvent } from "../types";
import type { MonitoringProvider } from "./monitoring-provider";

/**
 * Stub for Sentry — implement forwarding when @sentry/* is wired without changing the public API.
 */
export class SentryMonitoringProvider implements MonitoringProvider {
  public async capture(_event: MonitoringEvent): Promise<void> {
    // Intentionally no-op for now.
  }
}
