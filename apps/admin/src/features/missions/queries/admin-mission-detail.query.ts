import { queryOptions } from "@tanstack/react-query";

import { ServiceFailureError } from "../../../lib/api/serviceFailureError";
import { getAdminMissionDetail } from "../services/getAdminMissionDetail";
import { missionAdminKeys } from "./missionAdmin.keys";

export function adminMissionDetailOptions(missionId: string) {
  const id = missionId.trim();
  return queryOptions({
    queryKey: missionAdminKeys.detail(id),
    queryFn: async () => {
      const result = await getAdminMissionDetail(id);
      if (!result.success) {
        throw new ServiceFailureError(result.errorCode);
      }
      return result.data;
    },
    enabled: id.length > 0,
  });
}
