import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import * as jose from "https://esm.sh/jose@5.9.6";

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
  data?: Record<string, unknown>;
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

function jsonResponse(body: Json, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
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

/** Raw tokens allowed as `Authorization: Bearer <token>` (local runtime may expose several names). */
function collectServiceRoleTokens(): Set<string> {
  const out = new Set<string>();
  const add = (raw: string | undefined) => {
    const t = raw?.trim();
    if (t) out.add(t);
  };
  add(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  add(Deno.env.get("SERVICE_ROLE_KEY"));
  add(Deno.env.get("SECRET_KEY"));
  add(Deno.env.get("SUPABASE_SECRET_KEY"));

  const secretKeysJson = Deno.env.get("SUPABASE_SECRET_KEYS")?.trim();
  if (secretKeysJson) {
    try {
      const parsed = JSON.parse(secretKeysJson) as Record<string, unknown>;
      for (const v of Object.values(parsed)) {
        if (typeof v === "string") add(v);
      }
    } catch {
      // ignore invalid JSON
    }
  }
  return out;
}

function bearerTokenFromAuthorization(header: string): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return m ? m[1] : null;
}

/** For logs only — never log the raw token. */
function bearerShapeForLog(token: string | null): string {
  if (!token) return "empty";
  if (token.startsWith("eyJ")) return "jwt";
  if (token.startsWith("sb_secret_")) return "sb_secret";
  if (token.startsWith("sb_publishable_")) return "sb_publishable";
  return "other";
}

/** For logs only — shape of the primary service key used for Supabase admin client. */
function keyShapeForLog(key: string): string {
  if (!key) return "empty";
  if (key.startsWith("eyJ")) return "jwt";
  if (key.startsWith("sb_secret_")) return "sb_secret";
  return "other";
}

/** Parse origin `https://host` from Supabase project URL (JWKS base). */
function originOnlyFromUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

/** Decode JWT payload without verification — diagnostics / issuer discovery only. */
function decodeJwtPayloadUnsafe(token: string): Record<string, unknown> {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return {};
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = (4 - (b64.length % 4)) % 4;
    if (pad > 0) b64 += "=".repeat(pad);
    return JSON.parse(atob(b64)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function jwksVerifyServiceRoleAtOrigin(
  bearerToken: string,
  projectOrigin: string,
): Promise<boolean> {
  try {
    const o = projectOrigin.replace(/\/$/, "");
    const jwksUrl = new URL("/auth/v1/.well-known/jwks.json", `${o}/`);
    const JWKS = jose.createRemoteJWKSet(jwksUrl);
    const { payload } = await jose.jwtVerify(bearerToken, JWKS);
    return isInvokeJwtRole(payload.role);
  } catch {
    return false;
  }
}

/** Roles accepted for invoke after JWT signature verification (dashboard “Role: postgres”). */
function isInvokeJwtRole(role: unknown): boolean {
  return role === "service_role" || role === "postgres";
}

/** True if Bearer is a cryptographically valid admin-invoke JWT for this project. */
async function isVerifiedServiceRoleJwt(
  bearerToken: string,
  supabaseUrl: string,
): Promise<boolean> {
  if (!bearerToken.startsWith("eyJ")) {
    return false;
  }

  const symmetricSecrets = [
    Deno.env.get("SUPABASE_JWT_SECRET"),
    Deno.env.get("JWT_SECRET"),
    Deno.env.get("GOTRUE_JWT_SECRET"),
  ]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s))
    .map((s) => new TextEncoder().encode(s));

  for (const keyMaterial of symmetricSecrets) {
    try {
      const { payload } = await jose.jwtVerify(bearerToken, keyMaterial, {
        algorithms: ["HS256"],
      });
      if (isInvokeJwtRole(payload.role)) return true;
    } catch {
      continue;
    }
  }

  const projectOrigin = originOnlyFromUrl(supabaseUrl);
  const origins: string[] = [];
  if (projectOrigin) origins.push(projectOrigin);

  const unsafe = decodeJwtPayloadUnsafe(bearerToken);
  const iss = unsafe.iss;
  if (typeof iss === "string" && iss.startsWith("http")) {
    const issOrigin = originOnlyFromUrl(iss);
    if (
      issOrigin &&
      projectOrigin &&
      new URL(issOrigin).host === new URL(projectOrigin).host &&
      !origins.includes(issOrigin)
    ) {
      origins.push(issOrigin);
    }
  }

  for (const origin of origins) {
    if (await jwksVerifyServiceRoleAtOrigin(bearerToken, origin)) return true;
  }
  return false;
}

/**
 * When local JWKS/HS256 verify fails (Edge env often lacks JWT_SECRET), ask Supabase Auth
 * if this bearer is a real service admin — only `service_role` / equivalent passes `auth.admin`.
 */
async function bearerProvesServiceRoleViaAuthAdmin(
  supabaseUrl: string,
  bearerToken: string,
): Promise<boolean> {
  try {
    const probe = createClient(supabaseUrl, bearerToken, {
      global: {
        headers: {
          apikey: bearerToken,
          Authorization: `Bearer ${bearerToken}`,
        },
      },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await probe.auth.admin.listUsers();
    return !error;
  } catch {
    return false;
  }
}

async function isAuthorizedInvoke(
  bearerToken: string,
  allowedTokens: Set<string>,
  supabaseUrl: string,
): Promise<boolean> {
  if (allowedTokens.has(bearerToken)) return true;
  if (await isVerifiedServiceRoleJwt(bearerToken, supabaseUrl)) return true;

  if (!bearerToken.startsWith("eyJ")) return false;
  const unsafe = decodeJwtPayloadUnsafe(bearerToken);
  if (!isInvokeJwtRole(unsafe.role)) return false;
  return await bearerProvesServiceRoleViaAuthAdmin(supabaseUrl, bearerToken);
}

serve(async (req) => {
  const requestId = createRequestId();

  if (req.method !== "POST") {
    safeLog(requestId, "warn", "method_not_allowed", { method: req.method });
    return jsonResponse(
      { success: false, error: "METHOD_NOT_ALLOWED" },
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
      { status: 500 },
    );
  }

  const allowedTokens = collectServiceRoleTokens();
  allowedTokens.add(supabaseServiceRoleKey);

  const bearerToken = bearerTokenFromAuthorization(
    req.headers.get("Authorization") ?? "",
  );
  if (
    !bearerToken ||
    !(await isAuthorizedInvoke(bearerToken, allowedTokens, supabaseUrl))
  ) {
    let jwtVerifyOk: boolean | null = null;
    let unverifiedRole: unknown = null;
    let unverifiedIssHost: string | null = null;
    if (bearerToken?.startsWith("eyJ")) {
      jwtVerifyOk = await isVerifiedServiceRoleJwt(bearerToken, supabaseUrl);
      const p = decodeJwtPayloadUnsafe(bearerToken);
      unverifiedRole = p.role ?? null;
      const issRaw = p.iss;
      if (typeof issRaw === "string") {
        try {
          unverifiedIssHost = new URL(issRaw).host;
        } catch {
          unverifiedIssHost = null;
        }
      }
    }
    let supabaseUrlHost: string | null = null;
    try {
      supabaseUrlHost = new URL(supabaseUrl).host;
    } catch {
      supabaseUrlHost = null;
    }
    safeLog(requestId, "warn", "auth_rejected", {
      bearerShape: bearerShapeForLog(bearerToken),
      bearerLength: bearerToken?.length ?? 0,
      runtimeServiceKeyShape: keyShapeForLog(supabaseServiceRoleKey),
      allowedTokensCount: allowedTokens.size,
      exactMatchInAllowedSet: bearerToken ? allowedTokens.has(bearerToken) : false,
      jwtRolePathOk: jwtVerifyOk,
      supabaseUrlHost,
      unverifiedJwtRole: unverifiedRole,
      unverifiedJwtIssHost: unverifiedIssHost,
      issHostMatchesSupabaseUrl:
        Boolean(unverifiedIssHost) &&
        Boolean(supabaseUrlHost) &&
        unverifiedIssHost === supabaseUrlHost,
      hint:
        bearerToken?.startsWith("sb_secret_") &&
        supabaseServiceRoleKey.startsWith("eyJ")
          ? "dashboard_secret_is_sb_format_use_service_role_jwt_in_bearer"
          : bearerToken?.startsWith("sb_publishable_")
            ? "use_service_role_not_publishable"
            : unverifiedRole === "anon" || unverifiedRole === "authenticated"
              ? "bearer_jwt_is_not_service_role_copy_service_role_jwt_from_api_settings"
              : bearerToken?.startsWith("eyJ") && jwtVerifyOk === false
                ? "jwt_verify_failed_check_iss_host_match_and_use_es256_service_role_jwt"
                : "compare_bearer_to_project_settings_api_service_role",
    });
    return jsonResponse(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }
  safeLog(requestId, "info", "auth_ok");

  let payload: NotificationPayload;
  try {
    payload = (await req.json()) as NotificationPayload;
  } catch {
    safeLog(requestId, "warn", "invalid_json");
    return jsonResponse(
      { success: false, error: "INVALID_JSON" },
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
      { status: 400 },
    );
  }

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    global: {
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });

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
      { status: 500 },
    );
  }

  const pushToken = profile?.push_token?.trim() ?? "";
  if (!pushToken) {
    safeLog(requestId, "info", "no_push_token_skip");
    return jsonResponse({ success: true }, { status: 200 });
  }

  const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN")?.trim() ?? "";

  const expoPayload = {
    to: pushToken,
    title,
    body: bodyText,
    sound: "default",
    data: payload.data ?? {},
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
      { status: 502 },
    );
  }

  if (!expoRes.ok) {
    safeLog(requestId, "error", "expo_http_error", { status: expoRes.status });
    return jsonResponse(
      { success: false, error: "EXPO_HTTP_ERROR" },
      { status: 502 },
    );
  }

  const tickets = collectTickets(expoJson);
  if (tickets.length === 0) {
    safeLog(requestId, "warn", "expo_empty_tickets");
    return jsonResponse(
      { success: false, error: "EXPO_PUSH_UNKNOWN" },
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
        { status: 500 },
      );
    }
    safeLog(requestId, "info", "push_token_cleared_device_not_registered");
    return jsonResponse({ success: true }, { status: 200 });
  }

  if (first?.status === "error") {
    safeLog(requestId, "error", "expo_push_ticket_error", {
      ticketStatus: first.status,
      errorKind: first.details?.error ?? null,
      ticketMessage: first.message ?? null,
    });
    return jsonResponse(
      { success: false, error: "EXPO_PUSH_FAILED" },
      { status: 500 },
    );
  }

  safeLog(requestId, "info", "push_sent_ok");
  return jsonResponse({ success: true }, { status: 200 });
});
