import type { ServiceResult } from "../../../lib/api/serviceResult";
import {
  getLotteryCategoryOptionsList,
  type LotteryCategoryOption,
} from "../lib/lotteryCategories";

/**
 * Options de catégorie pour le formulaire de création (liste fixe produit).
 */
export async function getLotteryCategoryOptions(): Promise<
  ServiceResult<LotteryCategoryOption[]>
> {
  return { success: true, data: getLotteryCategoryOptionsList() };
}
