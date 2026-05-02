/**
 * MVP : envoi push manuel depuis l’admin Winlab.
 * Vérifie le JWT de session + `profiles.is_admin` (via `requireAdminServiceClient`) ;
 * Postgres / Expo passent par la service role **uniquement** ici (jamais exposée au navigateur).
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  bearerTokenFromAuthorization,
  requireAdminServiceClient,
} from "../_shared/adminEdgeAuth.ts";

type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json | undefined };

type NotificationPayload = {
  user_id: string;
  title: string;
  body: string;
};

type ExpoPushTicket = {
  status?: string;
  message?: string;
  details?: { error?: string };
};

function createRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function safeLog(
  requestId: string,
  level: "info" | "warn" | "error",
  message: string,
  data?: Record<string, unknown>,
) {
  console[level](
    JSON.stringify({
      requestId,
      message,
      ...(data ? { data } : {}),
      timestamp: Date.now(),
    }),
  );
}

/**
 * CORS : l’admin Vite appelle l’URL du projet en cross-origin ; le navigateur envoie
 * `OPTIONS` puis `POST`. Sans gestion d’OPTIONS + en-têtes, la préflight échoue (405, pas d’ACAO).
 */
function corsHeaders(req: Request): Headers {
  const h = new Headers();
  const origin = req.headers.get("Origin");
  h.set("Access-Control-Allow-Origin", origin ?? "*");
  h.set(
    "Access-Control-Allow-Headers",
    [
      "authorization",
      "apikey",
      "content-type",
      "x-client-info",
      "x-supabase-api-version",
      "accept-profile",
      "prefer",
    ].join(", "),
  );
  h.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  h.set("Access-Control-Max-Age", "86400");
  return h;
}

function jsonResponse(body: Json, req: Request, init?: ResponseInit): Response {
  const headers = corsHeaders(req);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function collectTickets(expoBody: unknown): ExpoPushTicket[] {
  if (!expoBody || typeof expoBody !== "object") {
    return [];
  }
  const data = (expoBody as { data?: unknown }).data;
  if (Array.isArray(data)) {
    return data as ExpoPushTicket[];
  }
  if (data && typeof data === "object") {
    return [data as ExpoPushTicket];
  }
  return [];
}

serve(async (req) => {
  const requestId = createRequestId();

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    safeLog(requestId, "warn", "method_not_allowed", { method: req.method });
    return jsonResponse(
      { success: false, error: "METHOD_NOT_ALLOWED" },
      req,
      { status: 405 },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
  const supabaseServiceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ||
    Deno.env.get("SERVICE_ROLE_KEY")?.trim() ||
    "";

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    safeLog(requestId, "error", "server_misconfigured");
    return jsonResponse(
      { success: false, error: "SERVER_MISCONFIGURED" },
      req,
      { status: 500 },
    );
  }

  const bearerToken = bearerTokenFromAuthorization(
    req.headers.get("Authorization") ?? "",
  );

  const adminAuth = await requireAdminServiceClient({
    bearerToken,
    supabaseUrl,
    serviceRoleKey: supabaseServiceRoleKey,
  });

  if (!adminAuth.ok) {
    const logMsg =
      adminAuth.error === "UNAUTHORIZED"
        ? "auth_rejected_unauthorized"
        : adminAuth.error === "FORBIDDEN"
          ? "auth_rejected_not_admin"
          : "auth_profile_check_failed";
    safeLog(requestId, "warn", logMsg, {
      error: adminAuth.error,
      ...(adminAuth.callerUserId
        ? { callerUserId: adminAuth.callerUserId }
        : {}),
    });
    return jsonResponse(
      { success: false, error: adminAuth.error },
      req,
      { status: adminAuth.status },
    );
  }

  const { admin, callerUserId } = adminAuth;
  safeLog(requestId, "info", "auth_ok_admin", { callerUserId });

  let payload: NotificationPayload;
  try {
    payload = (await req.json()) as NotificationPayload;
  } catch {
    safeLog(requestId, "warn", "invalid_json");
    return jsonResponse(
      { success: false, error: "INVALID_JSON" },
      req,
      { status: 400 },
    );
  }

  const userId = payload.user_id?.trim();
  const title = payload.title?.trim();
  const bodyText = payload.body?.trim();

  if (!userId || !title || !bodyText) {
    safeLog(requestId, "warn", "validation_failed", {
      hasUserId: Boolean(userId),
      hasTitle: Boolean(title),
      hasBody: Boolean(bodyText),
    });
    return jsonResponse(
      { success: false, error: "VALIDATION_ERROR" },
      req,
      { status: 400 },
    );
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("push_token")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    safeLog(requestId, "error", "profile_fetch_failed", {
      code: profileError.code,
    });
    return jsonResponse(
      { success: false, error: "PROFILE_FETCH_FAILED" },
      req,
      { status: 500 },
    );
  }

  const pushToken = profile?.push_token?.trim() ?? "";
  if (!pushToken) {
    safeLog(requestId, "info", "no_push_token_skip");
    return jsonResponse(
      { success: true, skipped_no_token: true },
      req,
      { status: 200 },
    );
  }

  const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN")?.trim() ?? "";

  const expoPayload = {
    to: pushToken,
    title,
    body: bodyText,
    sound: "default",
    data: {} as Record<string, unknown>,
  };

  const expoHeaders: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (expoAccessToken) {
    expoHeaders.Authorization = `Bearer ${expoAccessToken}`;
  }

  const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: expoHeaders,
    body: JSON.stringify(expoPayload),
  });

  let expoJson: unknown;
  try {
    expoJson = await expoRes.json();
  } catch {
    safeLog(requestId, "error", "expo_response_not_json", {
      status: expoRes.status,
    });
    return jsonResponse(
      { success: false, error: "EXPO_RESPONSE_INVALID" },
      req,
      { status: 502 },
    );
  }

  if (!expoRes.ok) {
    safeLog(requestId, "error", "expo_http_error", { status: expoRes.status });
    return jsonResponse(
      { success: false, error: "EXPO_HTTP_ERROR" },
      req,
      { status: 502 },
    );
  }

  const tickets = collectTickets(expoJson);
  if (tickets.length === 0) {
    safeLog(requestId, "warn", "expo_empty_tickets");
    return jsonResponse(
      { success: false, error: "EXPO_PUSH_UNKNOWN" },
      req,
      { status: 502 },
    );
  }

  const first = tickets[0];

  if (
    first?.status === "error" &&
    first.details?.error === "DeviceNotRegistered"
  ) {
    const { error: clearError } = await admin
      .from("profiles")
      .update({ push_token: null })
      .eq("id", userId);
    if (clearError) {
      safeLog(requestId, "error", "clear_push_token_failed", {
        code: clearError.code,
      });
      return jsonResponse(
        { success: false, error: "CLEAR_TOKEN_FAILED" },
        req,
        { status: 500 },
      );
    }
    safeLog(requestId, "info", "push_token_cleared_device_not_registered");
    return jsonResponse(
      { success: true, skipped_no_token: true },
      req,
      { status: 200 },
    );
  }

  if (first?.status === "error") {
    safeLog(requestId, "error", "expo_push_ticket_error", {
      ticketStatus: first.status,
      errorKind: first.details?.error ?? null,
      ticketMessage: first.message ?? null,
    });
    return jsonResponse(
      { success: false, error: "EXPO_PUSH_FAILED" },
      req,
      { status: 500 },
    );
  }

  safeLog(requestId, "info", "push_sent_ok");
  return jsonResponse(
    { success: true, skipped_no_token: false },
    req,
    { status: 200 },
  );
});
