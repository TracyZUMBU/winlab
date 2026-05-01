import { getSupabaseClient } from "@/src/lib/supabase/client";
import type { ErrorKind } from "@/src/lib/errors/errorKinds";
import { logger } from "@/src/lib/logger";
import { monitoring } from "@/src/lib/monitoring";

/** Stable codes returned by the `delete-my-account` edge function or inferred client-side. */
export type DeleteMyAccountErrorCode =
  | "UNAUTHENTICATED"
  | "SESSION_FORBIDDEN"
  | "METHOD_NOT_ALLOWED"
  | "SERVER_MISCONFIGURED"
  | "ANONYMIZE_PROFILE_FAILED"
  | "AUTH_DELETE_FAILED"
  | "INVOKE_FAILED"
  | "INVALID_RESPONSE"
  | "UNKNOWN_ERROR";

/** Subset surfaced as `errorCode` when `kind === "business"` (stable i18n mapping). */
export type DeleteMyAccountBusinessErrorCode =
  | "UNAUTHENTICATED"
  | "SESSION_FORBIDDEN"
  | "METHOD_NOT_ALLOWED"
  | "ANONYMIZE_PROFILE_FAILED"
  | "AUTH_DELETE_FAILED";

export type DeleteMyAccountResult =
  | { success: true; data: undefined }
  | {
      success: false;
      kind: "business";
      errorCode: DeleteMyAccountBusinessErrorCode;
    }
  | {
      success: false;
      kind: Exclude<ErrorKind, "business">;
    };

type EdgeSuccessBody = {
  success: true;
};

type EdgeErrorBody = {
  success: false;
  errorCode: string;
};

type InvokeErrorShape = {
  message?: string;
  context?: {
    status?: number;
    body?: unknown;
  };
};

const KNOWN_EDGE_CODES = new Set<string>([
  "UNAUTHENTICATED",
  "SESSION_FORBIDDEN",
  "METHOD_NOT_ALLOWED",
  "SERVER_MISCONFIGURED",
  "ANONYMIZE_PROFILE_FAILED",
  "AUTH_DELETE_FAILED",
]);

function parseJsonBody(body: unknown): unknown {
  if (body == null) return null;
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as unknown;
    } catch {
      return null;
    }
  }
  if (typeof body === "object") return body;
  return null;
}

function isEdgeErrorBody(value: unknown): value is EdgeErrorBody {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    o.success === false &&
    typeof o.errorCode === "string" &&
    o.errorCode.length > 0
  );
}

function isEdgeSuccessBody(value: unknown): value is EdgeSuccessBody {
  if (!value || typeof value !== "object") return false;
  return (value as Record<string, unknown>).success === true;
}

function normalizeEdgeErrorCode(raw: string): DeleteMyAccountErrorCode {
  if (KNOWN_EDGE_CODES.has(raw)) {
    return raw as DeleteMyAccountErrorCode;
  }
  return "UNKNOWN_ERROR";
}

function kindForCode(
  code: DeleteMyAccountErrorCode,
): ErrorKind {
  switch (code) {
    case "UNAUTHENTICATED":
    case "SESSION_FORBIDDEN":
    case "METHOD_NOT_ALLOWED":
    case "ANONYMIZE_PROFILE_FAILED":
    case "AUTH_DELETE_FAILED":
      return "business";
    case "SERVER_MISCONFIGURED":
    case "INVOKE_FAILED":
      return "technical";
    case "INVALID_RESPONSE":
    case "UNKNOWN_ERROR":
    default:
      return "unexpected";
  }
}

function shouldMonitorFailure(kind: ErrorKind): boolean {
  return kind === "technical" || kind === "unexpected";
}

/**
 * Deletes the current user account via the `delete-my-account` edge function.
 * Normalizes the contract: no raw backend strings are returned to callers.
 */
export async function deleteMyAccount(): Promise<DeleteMyAccountResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.functions.invoke<
    EdgeSuccessBody | EdgeErrorBody
  >("delete-my-account", { body: {} });

  if (error) {
    const e = error as InvokeErrorShape;
    let parsed = parseJsonBody(e.context?.body);
    if (!isEdgeErrorBody(parsed)) {
      const fromData = parseJsonBody(data as unknown);
      if (isEdgeErrorBody(fromData)) {
        parsed = fromData;
      }
    }
    if (isEdgeErrorBody(parsed)) {
      const code = normalizeEdgeErrorCode(parsed.errorCode);
      const kind = kindForCode(code);
      if (shouldMonitorFailure(kind)) {
        monitoring.captureException({
          name: "delete_my_account_edge_error",
          severity: "error",
          feature: "profile",
          message: `delete-my-account returned ${code}`,
          error,
          extra: {
            httpStatus: String(e.context?.status ?? ""),
          },
        });
      }
      logger.warn("[profile] delete-my-account failed", {
        code,
        kind,
        status: e.context?.status,
      });
      if (kind === "business") {
        return {
          success: false,
          kind: "business",
          errorCode: code as DeleteMyAccountBusinessErrorCode,
        };
      }
      return { success: false, kind };
    }

    monitoring.captureException({
      name: "delete_my_account_invoke_failed",
      severity: "error",
      feature: "profile",
      message: "delete-my-account invoke failed",
      error,
      extra: {
        httpStatus: String(e.context?.status ?? ""),
      },
    });
    logger.warn("[profile] delete-my-account invoke failed", {
      status: e.context?.status,
    });
    return { success: false, kind: "technical" };
  }

  if (isEdgeSuccessBody(data)) {
    return { success: true, data: undefined };
  }

  if (isEdgeErrorBody(data)) {
    const code = normalizeEdgeErrorCode(data.errorCode);
    const kind = kindForCode(code);
    if (shouldMonitorFailure(kind)) {
      monitoring.captureException({
        name: "delete_my_account_edge_error_body",
        severity: "error",
        feature: "profile",
        message: `delete-my-account body error ${code}`,
        error: new Error(code),
      });
    }
    logger.warn("[profile] delete-my-account failed (body)", { code, kind });
    if (kind === "business") {
      return {
        success: false,
        kind: "business",
        errorCode: code as DeleteMyAccountBusinessErrorCode,
      };
    }
    return { success: false, kind };
  }

  monitoring.captureException({
    name: "delete_my_account_invalid_response",
    severity: "error",
    feature: "profile",
    message: "delete-my-account invalid response shape",
    error: new Error("invalid response"),
  });
  logger.warn("[profile] delete-my-account invalid response");
  return { success: false, kind: "unexpected" };
}
