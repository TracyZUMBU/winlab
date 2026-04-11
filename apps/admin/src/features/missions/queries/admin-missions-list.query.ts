import { queryOptions } from "@tanstack/react-query";

import { ServiceFailureError } from "../../../lib/api/serviceFailureError";
import type {
  AdminMissionsListFilters,
  AdminMissionsListQueryInput,
  AdminMissionListItem,
} from "../types/missionAdmin";
import { getAdminMissions } from "../services/getAdminMissions";
import { getAdminMissionsCount } from "../services/getAdminMissionsCount";
import { missionAdminKeys } from "./missionAdmin.keys";

export type AdminMissionsListQueryData = {
  total: number;
  missions: AdminMissionListItem[];
};

export function toMissionsListFilters(
  input: AdminMissionsListQueryInput,
): AdminMissionsListFilters {
  const filters: AdminMissionsListFilters = {};
  const q = input.titleSearch.trim();
  if (q !== "") {
    filters.titleSearch = q;
  }
  const bid = input.brandId?.trim() ?? "";
  if (bid !== "") {
    filters.brandId = bid;
  }
  if (input.status !== "all") {
    filters.status = input.status;
  }
  if (input.missionType !== "all") {
    filters.missionType = input.missionType;
  }
  return filters;
}

export function adminMissionsListOptions(input: AdminMissionsListQueryInput) {
  return queryOptions({
    queryKey: missionAdminKeys.list(input),
    queryFn: async (): Promise<AdminMissionsListQueryData> => {
      const filters = toMissionsListFilters(input);
      const countResult = await getAdminMissionsCount(filters);
      if (!countResult.success) {
        throw new ServiceFailureError(countResult.errorCode);
      }
      const listResult = await getAdminMissions({
        ...filters,
        limit: input.limit,
        offset: input.offset,
        sort: input.sort,
      });
      if (!listResult.success) {
        throw new ServiceFailureError(listResult.errorCode);
      }
      return {
        total: countResult.data,
        missions: listResult.data,
      };
    },
  });
}
