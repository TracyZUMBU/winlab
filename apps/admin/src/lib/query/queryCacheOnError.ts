import { CancelledError, type Query } from "@tanstack/query-core";

import { monitoring } from "../monitoring";

/** Loosen generics to match `QueryCache` `onError` callback signature. */
type AnyQuery = Query<unknown, unknown, unknown, readonly unknown[]>;

/** Minimum delay between two identical reports (feature + error bucket) per app session. */
const THROTTLE_MS = 90_000;

const lastReportAtByKey = new Map<string, number>();

const EXCLUDED_POSTGREST_CODES = new Set<string>(["PGRST116"]);

const NETWORK_MESSAGE_MARKERS = [
  "network request failed",
  "failed to fetch",
  "network error",
  "internet connection appears to be offline",
  "load failed",
  "the request timed out",
] as const;

/** First segment of TanStack `queryKey` values used in this app (maps to monitoring `feature`). */
const KNOWN_QUERY_ROOTS = new Set<string>(["auth", "lotteryAdmin"]);

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && typeof error.message === "string") {
    return error.message;
  }
  return String(error ?? "");
}

function isLikelyNetworkError(error: unknown): boolean {
  const msg = getErrorMessage(error).toLowerCase();
  return NETWORK_MESSAGE_MARKERS.some((m) => msg.includes(m));
}

function getPostgrestCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const o = error as Record<string, unknown>;
  if (typeof o.code === "string" && o.code.length > 0) return o.code;
  return undefined;
}

function sanitizeQueryKeyForExtra(key: readonly unknown[]): unknown[] {
  const uuidLike =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return key.map((segment) => {
    if (typeof segment === "string" && uuidLike.test(segment)) {
      return "[id]";
    }
    return segment;
  });
}

export function queryKeyToMonitoringFeature(
  queryKey: readonly unknown[],
): string {
  const root = queryKey[0];
  if (typeof root === "string" && KNOWN_QUERY_ROOTS.has(root)) {
    return root;
  }
  return "unknown";
}

function throttleAllows(key: string): boolean {
  const now = Date.now();
  const prev = lastReportAtByKey.get(key) ?? 0;
  if (now - prev < THROTTLE_MS) {
    return false;
  }
  lastReportAtByKey.set(key, now);
  return true;
}

function errorBucketForThrottle(error: unknown): string {
  const code = getPostgrestCode(error);
  if (code) return `pg:${code}`;
  if (error instanceof Error && error.name) return `err:${error.name}`;
  return "err:unknown";
}

/**
 * Global TanStack Query cache handler: report read failures with filters + throttle
 * (aligned with `apps/mobile/src/lib/query/queryCacheOnError.ts`).
 */
export function handleQueryCacheError(error: Error, query: AnyQuery): void {
  if (error instanceof CancelledError) {
    return;
  }

  if (isLikelyNetworkError(error)) {
    return;
  }

  const code = getPostgrestCode(error);
  if (code && EXCLUDED_POSTGREST_CODES.has(code)) {
    return;
  }

  const feature = queryKeyToMonitoringFeature(query.queryKey);
  const throttleKey = `${feature}:${errorBucketForThrottle(error)}`;
  if (!throttleAllows(throttleKey)) {
    return;
  }

  monitoring.captureException({
    name: "tanstack_query_load_failed",
    severity: "error",
    feature,
    message: "TanStack Query load failed",
    error,
    extra: {
      queryKey: JSON.stringify(sanitizeQueryKeyForExtra(query.queryKey)),
      postgrestCode: code ?? "",
    },
  });
}
