/**
 * Loteries côté admin : types + services de lecture (pas de logique UI ici).
 * Pages : `pages/` ; composants : `components/`.
 */

export type {
  AdminLotteryDetail,
  AdminLotteryListItem,
  AdminLotteryWinner,
  CreateAdminLotteryInput,
  CreatedAdminLottery,
  LotteryAdminKnownStatus,
  LotteryAdminStatus,
  LotteryCreateStatus,
  LotteryFormBrandOption,
} from "./types/lotteryAdmin";
export {
  LOTTERY_ADMIN_STATUSES,
  LOTTERY_CREATE_STATUSES,
} from "./types/lotteryAdmin";
export { getAdminLotteries } from "./services/getAdminLotteries";
export { getAdminLotteryDetail } from "./services/getAdminLotteryDetail";
export { createAdminLottery } from "./services/createAdminLottery";
export { getActiveBrandsForLotteryForm } from "./services/getActiveBrandsForLotteryForm";
export { getLotteryCategoryOptions } from "./services/getLotteryCategoryOptions";
export { resolveDefaultLotteryBrandId } from "./lib/resolveDefaultLotteryBrandId";
export {
  LOTTERY_CREATE_FORM_DEFAULTS,
  getDefaultLotteryCreateDateFields,
} from "./lib/lotteryCreateFormDefaults";
export type { LotteryCreateFormDateFields } from "./lib/lotteryCreateFormDefaults";
export {
  LOTTERY_FORM_TIMEZONE,
  formatDateTimeLocalParis,
  getDefaultLotteryScheduleLocalParis,
  getParisWallParts,
  parseDateTimeLocalParis,
  parisLocalDateTimeToIso,
  parisWallTimeToUtc,
} from "./lib/lotteryFormParisTime";
export type {
  DefaultLotteryScheduleLocalParis,
  ParisWallDateTime,
} from "./lib/lotteryFormParisTime";
export { lotterySlugFromTitle } from "./lib/lotterySlugFromTitle";
export { getLotterySlugCollisionWarning } from "./lib/getLotterySlugCollisionWarning";
export {
  validateCreateLotteryForm,
} from "./lib/validateCreateLotteryForm";
export type {
  CreateLotteryFormValidationInput,
  CreateLotteryFormValidationResult,
} from "./lib/validateCreateLotteryForm";
export { useCreateAdminLotteryMutation } from "./hooks/useCreateAdminLotteryMutation";
export {
  adminLotteryFormBrandsQuery,
  adminLotteryFormCategoriesQuery,
} from "./queries/lottery-create-form-support.query";
export { CreateLotteryPanel } from "./components/CreateLotteryPanel";
export { LotteriesPage } from "./pages/LotteriesPage";
export { LotteryDetailFromRouteRedirect } from "./pages/LotteryDetailFromRouteRedirect";
export { LotteryDetailPage } from "./pages/LotteryDetailPage";
