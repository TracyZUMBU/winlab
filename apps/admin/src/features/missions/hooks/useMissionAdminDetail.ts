import { useQuery } from "@tanstack/react-query";

import { ServiceFailureError } from "../../../lib/api/serviceFailureError";
import { isSupabaseConfigured } from "../../../lib/supabase";
import { missionServiceErrorMessage } from "../missionErrorMessages";
import { adminMissionDetailOptions } from "../queries/admin-mission-detail.query";
import type { AdminMissionDetail } from "../types/missionAdmin";

export type MissionDetailState =
  | { kind: "loading" }
  | { kind: "error"; message: string; errorCode: string }
  | { kind: "not_found" }
  | { kind: "ok"; detail: AdminMissionDetail };

export function useMissionAdminDetail(missionId: string | undefined): MissionDetailState {
  const id = missionId?.trim() ?? "";

  const query = useQuery({
    ...adminMissionDetailOptions(id),
    enabled: isSupabaseConfigured() && id.length > 0,
  });

  if (!isSupabaseConfigured()) {
    return {
      kind: "error",
      errorCode: "CONFIGURATION",
      message: missionServiceErrorMessage("CONFIGURATION"),
    };
  }

  if (!id) {
    return { kind: "not_found" };
  }

  if (query.isPending) {
    return { kind: "loading" };
  }

  if (query.isError) {
    const err = query.error;
    if (err instanceof ServiceFailureError) {
      return {
        kind: "error",
        errorCode: err.errorCode,
        message: missionServiceErrorMessage(err.errorCode),
      };
    }
    return {
      kind: "error",
      errorCode: "UNKNOWN",
      message: missionServiceErrorMessage("UNKNOWN"),
    };
  }

  const detail = query.data;
  if (!detail) {
    return { kind: "not_found" };
  }

  return { kind: "ok", detail };
}
