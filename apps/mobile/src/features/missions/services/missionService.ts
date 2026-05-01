import { logger } from "@/src/lib/logger";
import { monitoring } from "@/src/lib/monitoring";
import type { ServiceResult } from "@/src/lib/types/serviceResult";
import { getSupabaseClient } from "@/src/lib/supabase/client";
import { Json } from "@/src/types/json";

export type SubmitMissionCompletionParams = {
  missionId: string;
  proofData?: Json;
};

/** Stable codes returned by the RPC when `success: false` (business rules). */
export type MissionSubmissionBusinessErrorCode =
  | "UNAUTHENTICATED"
  | "MISSION_NOT_FOUND"
  | "MISSION_NOT_ACTIVE"
  | "MISSION_NOT_STARTED"
  | "MISSION_EXPIRED"
  | "MISSION_USER_LIMIT_REACHED"
  | "MISSION_TOTAL_LIMIT_REACHED"
  | "SURVEY_CONFIG_INVALID"
  | "SURVEY_PROOF_INVALID"
  | "SURVEY_ANSWERS_INVALID";

/**
 * All keys used under `missions.submission.errors` in i18n (business + generic fallbacks).
 * Not returned by the service for `kind: "technical"` / `"unexpected"` (UI uses a generic key).
 */
export type MissionSubmissionErrorCode =
  | MissionSubmissionBusinessErrorCode
  | "INVALID_SERVER_RESPONSE"
  | "UNKNOWN_ERROR";

export type SubmitMissionCompletionResult = ServiceResult<
  { completionId: string },
  MissionSubmissionBusinessErrorCode
>;

const SUBMIT_MISSION_COMPLETION_RPC = "submit_mission_completion";

type SubmitMissionCompletionRpcRow = {
  success: boolean;
  completion_id: string | null;
  error_code: string | null;
};

const BUSINESS_ERROR_CODES = new Set<MissionSubmissionBusinessErrorCode>([
  "UNAUTHENTICATED",
  "MISSION_NOT_FOUND",
  "MISSION_NOT_ACTIVE",
  "MISSION_NOT_STARTED",
  "MISSION_EXPIRED",
  "MISSION_USER_LIMIT_REACHED",
  "MISSION_TOTAL_LIMIT_REACHED",
  "SURVEY_CONFIG_INVALID",
  "SURVEY_PROOF_INVALID",
  "SURVEY_ANSWERS_INVALID",
]);

export const submitMissionCompletion = async ({
  missionId,
  proofData,
}: SubmitMissionCompletionParams): Promise<SubmitMissionCompletionResult> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc(SUBMIT_MISSION_COMPLETION_RPC, {
    p_mission_id: missionId,
    p_proof_data: proofData ?? null,
  });

  if (error) {
    logger.warn("[missions] submit_mission_completion RPC failed", {
      missionId,
      error,
    });
    monitoring.captureException({
      name: "submit_mission_completion_rpc_failed",
      severity: "error",
      feature: "missions",
      message: "submit_mission_completion RPC failed",
      error,
      extra: { missionId },
    });
    return { success: false, kind: "technical" };
  }

  if (!Array.isArray(data) || data.length !== 1) {
    const err = new Error(
      "submit_mission_completion invalid server response (expected 1 row)",
    );
    logger.warn("[missions] submit_mission_completion invalid server response", {
      missionId,
      dataType: typeof data,
    });
    monitoring.captureException({
      name: "submit_mission_completion_invalid_server_response",
      severity: "error",
      feature: "missions",
      message: err.message,
      error: err,
      extra: { missionId },
    });
    return { success: false, kind: "unexpected" };
  }

  const row = data[0] as SubmitMissionCompletionRpcRow | null | undefined;
  if (!row || typeof row.success !== "boolean") {
    const err = new Error(
      "submit_mission_completion invalid server response (missing fields)",
    );
    logger.warn("[missions] submit_mission_completion invalid server response", {
      missionId,
    });
    monitoring.captureException({
      name: "submit_mission_completion_invalid_server_response",
      severity: "error",
      feature: "missions",
      message: err.message,
      error: err,
      extra: { missionId },
    });
    return { success: false, kind: "unexpected" };
  }

  if (row.success) {
    if (typeof row.completion_id !== "string" || row.completion_id.length === 0) {
      const err = new Error(
        "submit_mission_completion invalid server response (missing completion_id)",
      );
      logger.warn("[missions] submit_mission_completion invalid server response", {
        missionId,
      });
      monitoring.captureException({
        name: "submit_mission_completion_invalid_server_response",
        severity: "error",
        feature: "missions",
        message: err.message,
        error: err,
        extra: { missionId },
      });
      return { success: false, kind: "unexpected" };
    }
    return {
      success: true,
      data: { completionId: row.completion_id },
    };
  }

  if (typeof row.error_code !== "string" || row.error_code.length === 0) {
    const err = new Error(
      "submit_mission_completion invalid server response (missing error_code)",
    );
    logger.warn("[missions] submit_mission_completion invalid server response", {
      missionId,
    });
    monitoring.captureException({
      name: "submit_mission_completion_invalid_server_response",
      severity: "error",
      feature: "missions",
      message: err.message,
      error: err,
      extra: { missionId },
    });
    return { success: false, kind: "unexpected" };
  }

  const code = row.error_code as MissionSubmissionBusinessErrorCode;
  if (!BUSINESS_ERROR_CODES.has(code)) {
    const err = new Error(
      `submit_mission_completion unknown business error_code: ${row.error_code}`,
    );
    logger.warn("[missions] submit_mission_completion unknown error_code", {
      missionId,
      errorCode: row.error_code,
    });
    monitoring.captureException({
      name: "submit_mission_completion_unknown_error_code",
      severity: "error",
      feature: "missions",
      message: err.message,
      error: err,
      extra: { missionId, errorCode: row.error_code },
    });
    return { success: false, kind: "unexpected" };
  }

  return { success: false, kind: "business", errorCode: code };
};
