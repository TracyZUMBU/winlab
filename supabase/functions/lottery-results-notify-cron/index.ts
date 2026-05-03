/**
 * Cron (scheduler Supabase ou appel HTTP interne) : une vague de notifications
 * « résultats loterie » — secret partagé, pas de JWT utilisateur.
 * Flux : start_batch → participants (uuid[]) → Expo (1 push / user) → finalize_run ;
 * en cas d’échec d’orchestration avant finalisation, suppression du run (CASCADE sur les items).
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json | undefined };

type ExpoPushTicket = {
  status?: string;
  message?: string;
  details?: { error?: string };
};

const CRON_SECRET_HEADER = "x-winlab-cron-secret";

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

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  const maxLen = Math.max(ba.length, bb.length);
  let acc = ba.length ^ bb.length;
  const va = new Uint8Array(maxLen);
  const vb = new Uint8Array(maxLen);
  va.set(ba);
  vb.set(bb);
  for (let i = 0; i < maxLen; i++) {
    acc |= va[i] ^ vb[i];
  }
  return acc === 0;
}

function collectTickets(expoBody: unknown): ExpoPushTicket[] {
  if (!expoBody || typeof expoBody !== "object") return [];
  const data = (expoBody as { data?: unknown }).data;
  if (Array.isArray(data)) return data as ExpoPushTicket[];
  if (data && typeof data === "object") return [data as ExpoPushTicket];
  return [];
}

function clampBatchMax(raw: string | undefined): number {
  const n = Number.parseInt(raw?.trim() ?? "50", 10);
  if (!Number.isFinite(n)) return 50;
  return Math.max(1, Math.min(n, 500));
}

async function deleteRunForRetry(
  admin: SupabaseClient,
  requestId: string,
  runId: string,
): Promise<void> {
  const { error } = await admin
    .from("lottery_results_notify_runs")
    .delete()
    .eq("id", runId);
  if (error) {
    safeLog(requestId, "error", "delete_run_failed", { code: error.code });
  } else {
    safeLog(requestId, "warn", "run_deleted_for_retry");
  }
}

async function sendOneResultsPush(
  admin: SupabaseClient,
  requestId: string,
  userId: string,
  title: string,
  body: string,
): Promise<"sent" | "skipped_no_token" | "error"> {
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("push_token")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    safeLog(requestId, "warn", "profile_fetch_failed", {
      userId,
      code: profileError.code,
    });
    return "error";
  }

  const pushToken = profile?.push_token?.trim() ?? "";
  if (!pushToken) return "skipped_no_token";

  const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN")?.trim() ?? "";
  const expoPayload = {
    to: pushToken,
    title,
    body,
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
      userId,
      status: expoRes.status,
    });
    return "error";
  }

  if (!expoRes.ok) {
    safeLog(requestId, "error", "expo_http_error", {
      userId,
      status: expoRes.status,
    });
    return "error";
  }

  const tickets = collectTickets(expoJson);
  if (tickets.length === 0) {
    safeLog(requestId, "warn", "expo_empty_tickets", { userId });
    return "error";
  }

  const first = tickets[0];
  if (
    first?.status === "error" &&
    first.details?.error === "DeviceNotRegistered"
  ) {
    await admin.from("profiles").update({ push_token: null }).eq("id", userId);
    return "skipped_no_token";
  }

  if (first?.status === "error") {
    safeLog(requestId, "warn", "expo_push_ticket_error", {
      userId,
      ticketMessage: first.message ?? null,
      errorKind: first.details?.error ?? null,
    });
    return "error";
  }

  return "sent";
}

serve(async (req) => {
  const requestId = createRequestId();

  if (req.method !== "POST" && req.method !== "GET") {
    return jsonResponse({ ok: false, error: "METHOD_NOT_ALLOWED" }, {
      status: 405,
    });
  }

  const expectedSecret =
    Deno.env.get("LOTTERY_RESULTS_NOTIFY_CRON_SECRET")?.trim() ?? "";
  if (!expectedSecret) {
    safeLog(requestId, "error", "cron_secret_not_configured");
    return jsonResponse({ ok: false, error: "SERVER_MISCONFIGURED" }, {
      status: 500,
    });
  }

  const provided = req.headers.get(CRON_SECRET_HEADER)?.trim() ?? "";
  if (!timingSafeEqual(provided, expectedSecret)) {
    safeLog(requestId, "warn", "cron_secret_mismatch");
    return jsonResponse({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
  const supabaseServiceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ||
    Deno.env.get("SERVICE_ROLE_KEY")?.trim() ||
    "";

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    safeLog(requestId, "error", "supabase_env_missing");
    return jsonResponse({ ok: false, error: "SERVER_MISCONFIGURED" }, {
      status: 500,
    });
  }

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const batchMax = clampBatchMax(
    Deno.env.get("LOTTERY_RESULTS_NOTIFY_BATCH_MAX"),
  );

  const title =
    Deno.env.get("LOTTERY_RESULTS_NOTIFY_PUSH_TITLE")?.trim() ||
    "Résultats loterie";
  const body =
    Deno.env.get("LOTTERY_RESULTS_NOTIFY_PUSH_BODY")?.trim() ||
    "Les résultats d'une ou plusieurs loteries auxquelles vous participez sont disponibles. Ouvrez l'app pour voir si vous avez gagné.";

  let runId: string | null = null;

  try {
    const { data: batchJson, error: batchErr } = await admin.rpc(
      "lottery_results_notify_start_batch",
      { p_max: batchMax },
    );

    if (batchErr) {
      safeLog(requestId, "error", "start_batch_failed", {
        code: batchErr.code,
        message: batchErr.message,
      });
      return jsonResponse({ ok: false, error: "START_BATCH_FAILED" }, {
        status: 500,
      });
    }

    const batch = batchJson as {
      run_id?: string | null;
      lottery_ids?: string[];
    } | null;

    runId =
      typeof batch?.run_id === "string" && batch.run_id.length > 0
        ? batch.run_id
        : null;
    const lotteryIds = Array.isArray(batch?.lottery_ids)
      ? batch!.lottery_ids!.filter((id): id is string =>
        typeof id === "string" && id.length > 0
      )
      : [];

    if (!runId || lotteryIds.length === 0) {
      safeLog(requestId, "info", "no_pending_lotteries");
      return jsonResponse({
        ok: true,
        skipped: true,
        run_id: null,
        lottery_count: 0,
      });
    }

    const { data: userRows, error: usersErr } = await admin.rpc(
      "lottery_results_notify_distinct_participant_user_ids",
      { p_lottery_ids: lotteryIds },
    );

    if (usersErr) {
      safeLog(requestId, "error", "participant_ids_failed", {
        code: usersErr.code,
      });
      await deleteRunForRetry(admin, requestId, runId);
      return jsonResponse({ ok: false, error: "PARTICIPANT_QUERY_FAILED" }, {
        status: 500,
      });
    }

    const userIds = (userRows ?? []) as { user_id: string }[];
    let sent = 0;
    let skipped = 0;
    let pushErrors = 0;

    for (const row of userIds) {
      const uid = row.user_id;
      const outcome = await sendOneResultsPush(
        admin,
        requestId,
        uid,
        title,
        body,
      );
      if (outcome === "sent") sent++;
      else if (outcome === "skipped_no_token") skipped++;
      else pushErrors++;
    }

    const { data: finData, error: finErr } = await admin.rpc(
      "lottery_results_notify_finalize_run",
      { p_run_id: runId },
    );

    if (finErr) {
      safeLog(requestId, "error", "finalize_run_failed", {
        code: finErr.code,
        runId,
      });
      await deleteRunForRetry(admin, requestId, runId);
      return jsonResponse({ ok: false, error: "FINALIZE_FAILED" }, {
        status: 500,
      });
    }

    const finalizeResult = finData as {
      affected_items_count?: number;
      updated_runs_count?: number;
      run_found?: boolean;
      no_op?: boolean;
    } | null;

    if (finalizeResult?.run_found === false) {
      safeLog(requestId, "error", "finalize_run_row_not_found", {
        runId,
        finalizeResult,
      });
      await deleteRunForRetry(admin, requestId, runId);
      return jsonResponse({ ok: false, error: "FINALIZE_RUN_NOT_FOUND" }, {
        status: 500,
      });
    }

    if (finalizeResult?.no_op === true) {
      safeLog(requestId, "warn", "finalize_run_no_op", {
        runId,
        affected_items_count: finalizeResult.affected_items_count,
        updated_runs_count: finalizeResult.updated_runs_count,
        run_found: finalizeResult.run_found,
      });
    } else if (
      (finalizeResult?.affected_items_count ?? 0) > 0 &&
      (finalizeResult?.updated_runs_count ?? 0) === 0
    ) {
      safeLog(requestId, "warn", "finalize_run_items_without_run_update", {
        runId,
        affected_items_count: finalizeResult?.affected_items_count,
      });
    }

    safeLog(requestId, "info", "lottery_results_notify_cron_ok", {
      runId,
      lotteryCount: lotteryIds.length,
      userCount: userIds.length,
      sent,
      skipped,
      pushErrors,
      finalize_affected_items: finalizeResult?.affected_items_count,
      finalize_updated_runs: finalizeResult?.updated_runs_count,
    });

    return jsonResponse({
      ok: true,
      run_id: runId,
      lottery_count: lotteryIds.length,
      user_count: userIds.length,
      sent,
      skipped_no_token: skipped,
      push_errors: pushErrors,
      finalize: finalizeResult
        ? {
          affected_items_count: finalizeResult.affected_items_count ?? null,
          updated_runs_count: finalizeResult.updated_runs_count ?? null,
          run_found: finalizeResult.run_found ?? null,
          no_op: finalizeResult.no_op ?? null,
        }
        : null,
    });
  } catch (e) {
    safeLog(requestId, "error", "cron_unhandled_exception", {
      message: e instanceof Error ? e.message : String(e),
    });
    if (runId) await deleteRunForRetry(admin, requestId, runId);
    return jsonResponse({ ok: false, error: "INTERNAL_ERROR" }, {
      status: 500,
    });
  }
});
