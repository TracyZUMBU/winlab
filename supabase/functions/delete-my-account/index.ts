import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json | undefined };

/** Stable contract for the mobile app — never use free-text `error` as the primary UX contract. */
type DeleteMyAccountSuccess = { success: true };
type DeleteMyAccountFailure = { success: false; errorCode: string };

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
  // Never log tokens, API keys, emails, usernames, or other PII.
  console[level](
    JSON.stringify({
      requestId,
      message,
      ...(data ? { data } : {}),
      timestamp: Date.now(),
    }),
  );
}

function jsonResponse(
  body: Json,
  init?: ResponseInit,
): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });
}

function errorResponse(status: number, errorCode: string): Response {
  const body: DeleteMyAccountFailure = { success: false, errorCode };
  return jsonResponse(body as Json, { status });
}

function successResponse(): Response {
  const body: DeleteMyAccountSuccess = { success: true };
  return jsonResponse(body as Json, { status: 200 });
}

function getAuthAdminBaseUrl(supabaseUrl: string): string {
  try {
    const url = new URL(supabaseUrl);
    // In local `supabase functions serve`, edge runtime may run in a container where
    // localhost/127.0.0.1 points to itself instead of the host stack.
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
      url.hostname = "host.docker.internal";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return supabaseUrl.replace(/\/$/, "");
  }
}

serve(async (req) => {
  const requestId = createRequestId();

  if (req.method !== "POST") {
    safeLog(requestId, "warn", "method_not_allowed", { method: req.method });
    return errorResponse(405, "METHOD_NOT_ALLOWED");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    safeLog(requestId, "error", "server_misconfigured", {
      hasUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(supabaseAnonKey),
      hasServiceRoleKey: Boolean(supabaseServiceRoleKey),
    });
    return errorResponse(500, "SERVER_MISCONFIGURED");
  }

  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    safeLog(requestId, "warn", "missing_bearer_token");
    return errorResponse(401, "UNAUTHENTICATED");
  }

  // Verify the JWT and get the current user via anon client.
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    const msg = userError?.message ?? "invalid_token";
    // If the anon key / URL is misconfigured, auth.getUser() returns auth errors that look like token issues.
    const isLikelyServerMisconfig = msg.toLowerCase().includes("api key");
    const status = isLikelyServerMisconfig ? 500 : 401;
    safeLog(requestId, status === 500 ? "error" : "warn", "auth_get_user_failed", {
      status,
      supabaseAuthError: msg,
    });
    return errorResponse(
      status,
      isLikelyServerMisconfig ? "SERVER_MISCONFIGURED" : "UNAUTHENTICATED",
    );
  }

  const userId = userData.user.id;
  const role = (userData.user.role ?? "").toLowerCase();
  const aud = (userData.user.aud ?? "").toLowerCase();

  // Extra hardening: require a normal authenticated session token.
  if (role !== "authenticated" || aud !== "authenticated") {
    safeLog(requestId, "warn", "unexpected_user_claims", { role, aud });
    return errorResponse(403, "SESSION_FORBIDDEN");
  }

  // Admin client (service role) for DB writes + Auth admin soft delete.
  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    global: {
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) Anonymize profile.
  const anonymizedEmail = `deleted-${userId}@deleted.local`;
  const anonymizedUsername = `deleted_${userId.replaceAll("-", "").slice(0, 12)}`;

  const { data: updatedProfile, error: profileError } = await adminClient
    .from("profiles")
    .update({
      email: anonymizedEmail,
      username: anonymizedUsername,
      referral_code: null,
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (profileError) {
    safeLog(requestId, "error", "profile_anonymize_failed", {
      code: (profileError as { code?: string }).code ?? null,
      message: profileError.message,
    });
    return errorResponse(500, "ANONYMIZE_PROFILE_FAILED");
  }

  // Idempotence: if profile row is missing (unexpected), still proceed to soft delete auth.
  // This keeps the endpoint usable even if a previous run partially succeeded.
  if (!updatedProfile) {
    safeLog(requestId, "warn", "profile_row_missing", { userId });
  }

  // 2) Soft delete Auth user.
  // Note: use direct HTTP call to avoid SDK/version mismatch around shouldSoftDelete.
  const authAdminBaseUrl = getAuthAdminBaseUrl(supabaseUrl);
  const deleteResponse = await fetch(
    `${authAdminBaseUrl}/auth/v1/admin/users/${userId}`,
    {
      method: "DELETE",
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ should_soft_delete: true }),
    },
  );

  // Idempotence: if auth user is already deleted or missing, treat as success.
  if (deleteResponse.status === 404) {
    safeLog(requestId, "info", "auth_user_missing_already_deleted");
    return successResponse();
  }

  if (!deleteResponse.ok) {
    const text = await deleteResponse.text().catch(() => "");
    safeLog(requestId, "error", "auth_soft_delete_failed", {
      status: deleteResponse.status,
      bodyPrefix: text.slice(0, 200),
    });
    return errorResponse(500, "AUTH_DELETE_FAILED");
  }

  safeLog(requestId, "info", "delete_my_account_success");
  return successResponse();
});
