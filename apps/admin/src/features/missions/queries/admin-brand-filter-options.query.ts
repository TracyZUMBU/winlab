import { queryOptions } from "@tanstack/react-query";

import { ServiceFailureError } from "../../../lib/api/serviceFailureError";
import { getActiveBrandsForMissionFilters } from "../services/getActiveBrandsForMissionFilters";
import { missionAdminKeys } from "./missionAdmin.keys";

const BRAND_FILTER_STALE_MS = 5 * 60 * 1000;

export function adminBrandFilterOptionsQuery() {
  return queryOptions({
    queryKey: missionAdminKeys.brandsFilterOptions(),
    queryFn: async () => {
      const result = await getActiveBrandsForMissionFilters();
      if (!result.success) {
        throw new ServiceFailureError(result.errorCode);
      }
      return result.data;
    },
    staleTime: BRAND_FILTER_STALE_MS,
  });
}
