/**
 * Loteries côté admin : types + services de lecture (pas de logique UI ici).
 * Pages : `pages/` ; composants : `components/`.
 */

export type {
  GetLotteriesResult,
  LotteryAdminKnownStatus,
  LotteryAdminListItem,
  LotteryAdminStatus,
} from "./types/lotteryAdmin";
export { LOTTERY_ADMIN_STATUSES } from "./types/lotteryAdmin";
export type {
  LotteryAdminDetail,
  LotteryAdminWinnerEntry,
} from "./types/lotteryAdminDetail";
export { getLotteries } from "./services/getLotteries";
export { getLotteryAdminDetail } from "./services/getLotteryAdminDetail";
export { LotteriesPage } from "./pages/LotteriesPage";
export { LotteryDetailPage } from "./pages/LotteryDetailPage";
