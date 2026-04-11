export type {
  MonitoringSeverity,
  MonitoringError,
  MonitoringEventBase,
  MonitoringMessageEvent,
  MonitoringExceptionEvent,
  MonitoringEvent,
  SanitizedData,
} from "./types";

export { normalizeError } from "./normalize-error";

export {
  sanitizeMonitoringFields,
  sanitizeMonitoringEvent,
  hashUserId,
} from "./sanitize-monitoring-event";

export {
  MonitoringService,
  type CaptureMessageInput,
  type CaptureExceptionInput,
  type MonitoringServiceOptions,
  toSeverityOrFallback,
} from "./monitoring-service";

export type { MonitoringProvider } from "./providers/monitoring-provider";

export { ConsoleMonitoringProvider } from "./providers/console-monitoring-provider";
export type {
  ConsoleMonitoringProviderOptions,
  MonitoringConsoleSink,
} from "./providers/console-monitoring-provider";

export { SlackMonitoringProvider } from "./providers/slack-monitoring-provider";
export type {
  SlackMonitoringProviderOptions,
  MonitoringFunctionsInvokeClient,
} from "./providers/slack-monitoring-provider";

export { SentryMonitoringProvider } from "./providers/sentry-monitoring-provider";
