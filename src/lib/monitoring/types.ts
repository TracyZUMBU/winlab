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
   * Identifier metier / technique du type d'evenement.
   * Exemple: "mission_completion_failed"
   */
  name: string;
  /** Message humain pour lecture rapide */
  message: string;
  severity: MonitoringSeverity;

  /** Timestamp en millisecondes (Date.now()) */
  timestamp: number;
  /** Enrichi par MonitoringService */
  environment: string;
  /** Enrichi par MonitoringService */
  service: string;

  /** Contexte optionnel */
  feature?: string;
  /**
   * Pseudonymized user identifier.
   *
   * IMPORTANT:
   * - Never pass raw personal data (emails, phone numbers, names, etc.).
   * - This value must be hashed/pseudonymized before events are emitted.
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
 * SanitizedMonitoringData marker for extra monitoring fields.
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

