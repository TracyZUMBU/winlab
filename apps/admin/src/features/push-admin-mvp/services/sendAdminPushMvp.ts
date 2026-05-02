import { mapSupabaseToErrorCode } from "../../../lib/api/mapSupabaseToErrorCode";
import type { ServiceResult } from "../../../lib/api/serviceResult";
import { getSupabaseClient, isSupabaseConfigured } from "../../../lib/supabase";

const FN_ADMIN_SEND_PUSH_MVP = "admin-send-push-mvp";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SendAdminPushMvpInput = {
  userId: string;
  title: string;
  body: string;
};

export type SendAdminPushMvpData = {
  skippedNoToken: boolean;
};

type InvokeOkBody = {
  success?: unknown;
  skipped_no_token?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mapEdgeErrorToCode(raw: string): string {
  switch (raw) {
    case "UNAUTHORIZED":
      return "UNAUTHORIZED";
    case "FORBIDDEN":
      return "FORBIDDEN";
    case "PROFILE_CHECK_FAILED":
      return "PROFILE_CHECK_FAILED";
    case "METHOD_NOT_ALLOWED":
      return "METHOD_NOT_ALLOWED";
    case "SERVER_MISCONFIGURED":
      return "SERVER_MISCONFIGURED";
    case "INVALID_JSON":
      return "INVALID_JSON";
    case "VALIDATION_ERROR":
      return "VALIDATION_ERROR";
    case "PROFILE_FETCH_FAILED":
      return "PROFILE_FETCH_FAILED";
    case "EXPO_RESPONSE_INVALID":
    case "EXPO_HTTP_ERROR":
    case "EXPO_PUSH_UNKNOWN":
      return "PUSH_DELIVERY_FAILED";
    case "EXPO_PUSH_FAILED":
      return "PUSH_DELIVERY_FAILED";
    case "CLEAR_TOKEN_FAILED":
      return "CLEAR_TOKEN_FAILED";
    default:
      return "EDGE_UNKNOWN";
  }
}

async function readInvokeErrorBody(error: unknown): Promise<string | null> {
  if (!isRecord(error)) return null;
  const ctx = error.context;
  if (!(ctx instanceof Response)) return null;
  try {
    const json: unknown = await ctx.json();
    if (!isRecord(json)) return null;
    const err = json.error;
    return typeof err === "string" ? err : null;
  } catch {
    return null;
  }
}

/**
 * Envoie une notification push à un profil (`profiles.id` = utilisateur cible),
 * via l’Edge Function MVP (JWT session admin / utilisateur authentifié).
 */
export async function sendAdminPushMvp(
  input: SendAdminPushMvpInput,
): Promise<ServiceResult<SendAdminPushMvpData>> {
  if (!isSupabaseConfigured()) {
    return { success: false, errorCode: "CONFIGURATION" };
  }

  const userId = input.userId.trim();
  const title = input.title.trim();
  const body = input.body.trim();

  if (!UUID_RE.test(userId)) {
    return { success: false, errorCode: "INVALID_USER_ID" };
  }
  if (!title || !body) {
    return { success: false, errorCode: "VALIDATION_ERROR" };
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.functions.invoke<InvokeOkBody>(
      FN_ADMIN_SEND_PUSH_MVP,
      {
        body: {
          user_id: userId,
          title,
          body,
        },
      },
    );

    if (error) {
      const edgeErr = await readInvokeErrorBody(error);
      if (edgeErr) {
        return { success: false, errorCode: mapEdgeErrorToCode(edgeErr) };
      }
      return { success: false, errorCode: mapSupabaseToErrorCode(error) };
    }

    if (!data || data.success !== true) {
      return { success: false, errorCode: "EDGE_UNKNOWN" };
    }

    return {
      success: true,
      data: { skippedNoToken: data.skipped_no_token === true },
    };
  } catch (e) {
    return { success: false, errorCode: mapSupabaseToErrorCode(e) };
  }
}
