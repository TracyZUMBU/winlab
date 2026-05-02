/**
 * Exécute `public.run_lottery(p_lottery_id)` pour un administrateur Winlab.
 * JWT session + `profiles.is_admin` via `requireAdminServiceClient` ; la RPC reste réservée au service_role.
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

const RUN_LOTTERY_ERROR_TAGS = [
  "LOTTERY_NOT_FOUND",
  "LOTTERY_ALREADY_DRAWN",
  "LOTTERY_CANCELLED",
  "LOTTERY_DRAFT",
  "LOTTERY_NOT_CLOSED",
  "LOTTERY_DRAW_NOT_READY",
  "LOTTERY_NOT_ENDED",
] as const;

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

function mapRunLotteryRpcError(message: string | undefined): string {
  const m = message ?? "";
  for (const tag of RUN_LOTTERY_ERROR_TAGS) {
    if (m.includes(tag)) return tag;
  }
  return "RUN_LOTTERY_RPC_FAILED";
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    safeLog(requestId, "warn", "invalid_json");
    return jsonResponse(
      { success: false, error: "INVALID_JSON" },
      req,
      { status: 400 },
    );
  }

  const lotteryId =
    typeof body === "object" && body !== null && "lottery_id" in body
      ? String((body as { lottery_id?: unknown }).lottery_id ?? "").trim()
      : "";

  if (!UUID_RE.test(lotteryId)) {
    safeLog(requestId, "warn", "validation_lottery_id");
    return jsonResponse(
      { success: false, error: "INVALID_LOTTERY_ID" },
      req,
      { status: 400 },
    );
  }

  const { data, error } = await admin.rpc("run_lottery", {
    p_lottery_id: lotteryId,
  });

  if (error) {
    const mapped = mapRunLotteryRpcError(error.message);
    safeLog(requestId, "warn", "run_lottery_rpc_error", {
      mapped,
      code: error.code,
    });
    return jsonResponse(
      { success: false, error: mapped },
      req,
      { status: 400 },
    );
  }

  const winnerTicketIds = Array.isArray(data)
    ? (data as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  safeLog(requestId, "info", "run_lottery_ok", {
    lotteryId,
    winnersDrawn: winnerTicketIds.length,
  });

  return jsonResponse(
    {
      success: true,
      winner_ticket_ids: winnerTicketIds,
    },
    req,
    { status: 200 },
  );
});
