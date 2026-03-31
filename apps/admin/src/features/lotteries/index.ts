/**
 * Loteries côté admin : types + services de lecture (pas de logique UI ici).
 */

export type {
  GetLotteriesResult,
  LotteryAdminKnownStatus,
  LotteryAdminListItem,
  LotteryAdminStatus,
} from "./types/lotteryAdmin";
export { LOTTERY_ADMIN_STATUSES } from "./types/lotteryAdmin";
export { getLotteries } from "./services/getLotteries";
