import { monitoring } from "@/src/lib/monitoring";
import { getSupabaseClient } from "@/src/lib/supabase/client";
import { Json } from "@/src/types/json";

export type SubmitMissionCompletionParams = {
  missionId: string;
  proofData?: Json;
};

export type MissionSubmissionErrorCode =
  | "UNAUTHENTICATED"
  | "MISSION_NOT_FOUND"
  | "MISSION_NOT_ACTIVE"
  | "MISSION_NOT_STARTED"
  | "MISSION_EXPIRED"
  | "MISSION_USER_LIMIT_REACHED"
  | "MISSION_TOTAL_LIMIT_REACHED"
  | "INVALID_SERVER_RESPONSE"
  | "UNKNOWN_ERROR";

export type SubmitMissionCompletionResult =
  | {
      success: true;
      completionId: string;
    }
  | {
      success: false;
      errorCode: MissionSubmissionErrorCode;
    };

const SUBMIT_MISSION_COMPLETION_RPC = "submit_mission_completion";

type SubmitMissionCompletionRpcRow = {
  success: boolean;
  completion_id: string | null;
  error_code: string | null;
};

const BUSINESS_ERROR_CODES = new Set<MissionSubmissionErrorCode>([
  "UNAUTHENTICATED",
  "MISSION_NOT_FOUND",
  "MISSION_NOT_ACTIVE",
  "MISSION_NOT_STARTED",
  "MISSION_EXPIRED",
  "MISSION_USER_LIMIT_REACHED",
  "MISSION_TOTAL_LIMIT_REACHED",
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
    monitoring.captureMessage({
      name: "mission_completion_rpc_failed",
      severity: "critical",
      feature: "missions",
      message: error.message ?? "submit_mission_completion RPC failed",
      extra: { missionId },
    });
    return {
      success: false,
      errorCode: "UNKNOWN_ERROR",
    };
  }

  if (!Array.isArray(data) || data.length !== 1) {
    return {
      success: false,
      errorCode: "INVALID_SERVER_RESPONSE",
    };
  }

  const row = data[0] as SubmitMissionCompletionRpcRow | null | undefined;
  if (!row || typeof row.success !== "boolean") {
    return {
      success: false,
      errorCode: "INVALID_SERVER_RESPONSE",
    };
  }

  if (row.success) {
    if (!row.completion_id) {
      return {
        success: false,
        errorCode: "INVALID_SERVER_RESPONSE",
      };
    }
    return {
      success: true,
      completionId: row.completion_id,
    };
  }

  if (typeof row.error_code !== "string" || row.error_code.length === 0) {
    return {
      success: false,
      errorCode: "INVALID_SERVER_RESPONSE",
    };
  }

  const code = row.error_code as MissionSubmissionErrorCode;
  if (!BUSINESS_ERROR_CODES.has(code)) {
    return {
      success: false,
      errorCode: "UNKNOWN_ERROR",
    };
  }

  return {
    success: false,
    errorCode: code,
  };
};
