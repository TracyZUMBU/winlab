import { useQuery } from "@tanstack/react-query";

import { ServiceFailureError } from "../../../lib/api/serviceFailureError";
import { isSupabaseConfigured } from "../../../lib/supabase";
import {
  adminMissionsListOptions,
  type AdminMissionsListQueryData,
} from "../queries/admin-missions-list.query";
import type { AdminMissionsListQueryInput } from "../types/missionAdmin";
import { missionServiceErrorMessage } from "../missionErrorMessages";

export type AdminMissionsListQueryState =
  | { kind: "loading" }
  | { kind: "error"; message: string; errorCode: string }
  | { kind: "ok"; data: AdminMissionsListQueryData; input: AdminMissionsListQueryInput };

export function useAdminMissionsListQuery(
  input: AdminMissionsListQueryInput,
): AdminMissionsListQueryState {
  const query = useQuery({
    ...adminMissionsListOptions(input),
    enabled: isSupabaseConfigured(),
  });

  if (!isSupabaseConfigured()) {
    return {
      kind: "error",
      errorCode: "CONFIGURATION",
      message: missionServiceErrorMessage("CONFIGURATION"),
    };
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

  return {
    kind: "ok",
    data: query.data ?? { total: 0, missions: [] },
    input,
  };
}
