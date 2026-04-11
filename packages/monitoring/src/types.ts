export type MonitoringSeverity =
  | "debug"
  | "info"
  | "warning"
  | "error"
  | "critical";

export type MonitoringError = {
  name?: string;
  message: string;
  stack?: string;
};

export type MonitoringEventBase = {
  /**
   * Business/technical identifier for the event type.
   * Example: "mission_completion_failed"
   */
  name: string;
  /** Human-readable message */
  message: string;
  severity: MonitoringSeverity;

  /** Timestamp in milliseconds (Date.now()) */
  timestamp: number;
  /** Populated by MonitoringService */
  environment: string;
  /** Populated by MonitoringService — use stable app ids e.g. winlab-mobile, winlab-admin */
  service: string;

  /** Optional context */
  feature?: string;
  /**
   * Pseudonymized user identifier.
   *
   * IMPORTANT:
   * - Never pass raw personal data (emails, phone numbers, names, etc.).
   * - This value is hashed/pseudonymized before events are emitted.
   */
  userId?: string;
  requestId?: string;
  tags?: Record<string, string>;
  /**
   * Pre-sanitized additional event fields.
   *
   * IMPORTANT:
   * - Must not contain raw personal data (emails, credentials, tokens, secrets).
   * - Should be safe, already cleaned, and composed of simple string values.
   * - The logging pipeline will also perform a best-effort redaction.
   */
  extra?: SanitizedData;
};

/**
 * SanitizedData marker for extra monitoring fields.
 *
 * Note: Even when the type is respected, the logging pipeline still performs
 * best-effort redaction to prevent sensitive data from being emitted.
 */
export type SanitizedData = Record<string, string>;

export type MonitoringMessageEvent = MonitoringEventBase & {
  type: "message";
};

export type MonitoringExceptionEvent = MonitoringEventBase & {
  type: "exception";
  error: MonitoringError;
};

export type MonitoringEvent = MonitoringMessageEvent | MonitoringExceptionEvent;
