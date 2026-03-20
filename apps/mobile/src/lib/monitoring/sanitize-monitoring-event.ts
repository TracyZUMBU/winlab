import type {
  MonitoringEvent,
  MonitoringEventBase,
  MonitoringExceptionEvent,
  SanitizedData,
} from "./types";

const EMAIL_REGEX =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

// Very small/heuristic redaction for tokens; goal is to avoid emitting raw secrets.
const JWT_LIKE_REGEX = /\b[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/g;
const BEARER_REGEX = /\bBearer\s+[A-Za-z0-9-._~+/]+=*\b/gi;

const SENSITIVE_KEYWORDS = [
  "email",
  "mail",
  "phone",
  "password",
  "pwd",
  "secret",
  "token",
  "jwt",
  "authorization",
  "auth",
  "api_key",
  "apikey",
  "credential",
  "credentials",
  "session",
] as const;

function isSensitiveKey(key: string): boolean {
  const k = key.toLowerCase();
  return SENSITIVE_KEYWORDS.some((s) => k.includes(s));
}

function redactSensitiveString(input: string): string {
  // Redact common PII/secrets patterns. This is best-effort; do not rely on it
  // for compliance guarantees alone (server-side enforcement still required).
  let out = input;
  out = out.replace(EMAIL_REGEX, "[REDACTED_EMAIL]");
  out = out.replace(JWT_LIKE_REGEX, "[REDACTED_TOKEN]");
  out = out.replace(BEARER_REGEX, "Bearer [REDACTED_TOKEN]");

  // Key=value style secrets (best-effort).
  out = out.replace(
    /(password|passcode|pwd|secret|api[_-]?key|token|authorization)\s*[:=]\s*([^\s,;]+)/gi,
    (_match, key) => `${key}=[REDACTED]`,
  );

  return out;
}

function sanitizeRecordOfStrings(
  record: unknown,
  opts: { redactValues: boolean },
): Record<string, string> | undefined {
  if (!record || typeof record !== "object") return undefined;

  const entries = Object.entries(record as Record<string, unknown>);
  const out: Record<string, string> = {};

  for (const [key, value] of entries) {
    if (isSensitiveKey(key)) continue;

    if (typeof value === "string") {
      out[key] = opts.redactValues ? redactSensitiveString(value) : value;
      continue;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      out[key] = String(value);
      continue;
    }

    if (value == null) continue;

    // Never stringify unknown objects; they might contain sensitive data.
    out[key] = "[REDACTED_OBJECT]";
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

function stringifyForRedaction(value: unknown): string {
  if (typeof value === "string") return redactSensitiveString(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value == null) return "";
  return "[REDACTED_OBJECT]";
}

export function sanitizeMonitoringFields(
  fields: Pick<
    MonitoringEventBase,
    "feature" | "message" | "requestId" | "tags" | "extra"
  >,
): Pick<MonitoringEventBase, "feature" | "message" | "requestId" | "tags" | "extra"> {
  return {
    feature: fields.feature ? redactSensitiveString(fields.feature) : undefined,
    message: redactSensitiveString(fields.message),
    requestId: fields.requestId ? redactSensitiveString(String(fields.requestId)) : undefined,
    tags: sanitizeRecordOfStrings(fields.tags, { redactValues: true }),
    extra: sanitizeExtra(fields.extra),
  };
}

function sanitizeExtra(extra: unknown): SanitizedData | undefined {
  if (!extra || typeof extra !== "object") return undefined;

  const entries = Object.entries(extra as Record<string, unknown>);
  const out: Record<string, string> = {};

  for (const [key, value] of entries) {
    if (isSensitiveKey(key)) continue;
    out[key] = stringifyForRedaction(value);
  }

  return Object.keys(out).length > 0 ? (out as SanitizedData) : undefined;
}

function fnv1aHashHex(input: string): string {
  // Simple non-cryptographic hash used only as a privacy-preserving fallback.
  // Security is not the goal; preventing raw PII emission is.
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0; // FNV prime
  }
  return hash.toString(16).padStart(8, "0");
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function utf8Bytes(input: string): Uint8Array<ArrayBuffer> {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(input);
  }

  // Minimal fallback for environments without TextEncoder.
  const bytes = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) {
    bytes[i] = input.charCodeAt(i) & 0xff;
  }
  return bytes;
}

export async function hashUserId(
  userId: string,
  context: { environment: string; service: string },
): Promise<string> {
  const normalized = userId.trim();
  if (!normalized) return "";

  const preimage = `winlab-monitoring:${context.environment}:${context.service}:${normalized}`;

  try {
    const subtle = globalThis.crypto?.subtle;
    if (subtle && typeof subtle.digest === "function") {
      const data = utf8Bytes(preimage);
      const digest = await subtle.digest("SHA-256", data);
      return bytesToHex(new Uint8Array(digest));
    }
  } catch {
    // Fall back to deterministic non-crypto hash below.
  }

  return fnv1aHashHex(preimage);
}

export async function sanitizeMonitoringEvent(
  event: MonitoringEvent,
): Promise<MonitoringEvent> {
  const baseSanitized = sanitizeMonitoringFields({
    feature: event.feature,
    message: event.message,
    requestId: event.requestId,
    tags: event.tags,
    extra: event.extra,
  });

  const hashedUserId =
    typeof event.userId === "string" && event.userId.trim().length > 0
      ? await hashUserId(event.userId, {
          environment: event.environment,
          service: event.service,
        })
      : undefined;

  if (event.type === "exception") {
    const exception = event as MonitoringExceptionEvent;

    return {
      ...exception,
      ...baseSanitized,
      userId: hashedUserId,
      error: {
        ...exception.error,
        message: redactSensitiveString(exception.error.message),
        stack: exception.error.stack ? redactSensitiveString(exception.error.stack) : undefined,
      },
    };
  }

  return {
    ...event,
    ...baseSanitized,
    userId: hashedUserId,
  };
}

