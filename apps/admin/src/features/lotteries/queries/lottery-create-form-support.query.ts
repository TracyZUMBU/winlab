import { queryOptions } from "@tanstack/react-query";

import { ServiceFailureError } from "../../../lib/api/serviceFailureError";
import { getActiveBrandsForLotteryForm } from "../services/getActiveBrandsForLotteryForm";
import { getLotteryCategoryOptions } from "../services/getLotteryCategoryOptions";
import { lotteryAdminKeys } from "./lotteryAdmin.keys";

const FORM_SUPPORT_STALE_MS = 5 * 60 * 1000;

export function adminLotteryFormBrandsQuery() {
  return queryOptions({
    queryKey: lotteryAdminKeys.formBrands(),
    queryFn: async () => {
      const result = await getActiveBrandsForLotteryForm();
      if (!result.success) {
        throw new ServiceFailureError(result.errorCode);
      }
      return result.data;
    },
    staleTime: FORM_SUPPORT_STALE_MS,
  });
}

export function adminLotteryFormCategoriesQuery() {
  return queryOptions({
    queryKey: lotteryAdminKeys.formCategories(),
    queryFn: async () => {
      const result = await getLotteryCategoryOptions();
      if (!result.success) {
        throw new ServiceFailureError(result.errorCode);
      }
      return result.data;
    },
    staleTime: FORM_SUPPORT_STALE_MS,
  });
}
