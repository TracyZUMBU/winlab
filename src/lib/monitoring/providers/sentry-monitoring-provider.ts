import type { MonitoringEvent } from "../types";
import type { MonitoringProvider } from "./monitoring-provider";

/**
 * Stub pour Sentry.
 *
 * Objectif: fournir une interface claire pour brancher Sentry plus tard
 * sans changer l'API metier (`monitoring.captureMessage/captureException`).
 */
export class SentryMonitoringProvider implements MonitoringProvider {
  public async capture(_event: MonitoringEvent): Promise<void> {
    // Intentionally no-op for now.
    // When Sentry is installed, this method can forward:
    // - exceptions: Sentry.captureException(...)
    // - messages: Sentry.captureMessage(...)
  }
}

