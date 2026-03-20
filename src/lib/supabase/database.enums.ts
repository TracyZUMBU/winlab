/**
 * Valeurs des types ENUM PostgreSQL du schéma `public`.
 *
 * Fichier généré automatiquement à partir de la migration :
 * `supabase/migrations/20260318085739_initial_remote_schema.sql`
 *
 * Ne pas modifier manuellement : lancer `npm run gen:types`
 * depuis `apps/mobile` pour régénérer ce fichier.
 */

/** lottery_status */
export const LotteryStatus = {
  draft: 'draft',
  active: 'active',
  closed: 'closed',
  drawn: 'drawn',
  cancelled: 'cancelled'
} as const;
export type LotteryStatus = (typeof LotteryStatus)[keyof typeof LotteryStatus];

/** lottery_ticket_status */
export const LotteryTicketStatus = {
  active: 'active',
  cancelled: 'cancelled'
} as const;
export type LotteryTicketStatus = (typeof LotteryTicketStatus)[keyof typeof LotteryTicketStatus];

/** meal_type */
export const MealType = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner'
} as const;
export type MealType = (typeof MealType)[keyof typeof MealType];

/** mission_completion_status */
export const MissionCompletionStatus = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected'
} as const;
export type MissionCompletionStatus = (typeof MissionCompletionStatus)[keyof typeof MissionCompletionStatus];

/** mission_status */
export const MissionStatus = {
  draft: 'draft',
  active: 'active',
  paused: 'paused',
  archived: 'archived'
} as const;
export type MissionStatus = (typeof MissionStatus)[keyof typeof MissionStatus];

/** mission_type */
export const MissionType = {
  survey: 'survey',
  video: 'video',
  follow: 'follow',
  referral: 'referral',
  custom: 'custom'
} as const;
export type MissionType = (typeof MissionType)[keyof typeof MissionType];

/** mission_validation_mode */
export const MissionValidationMode = {
  automatic: 'automatic',
  manual: 'manual'
} as const;
export type MissionValidationMode = (typeof MissionValidationMode)[keyof typeof MissionValidationMode];

/** referral_status */
export const ReferralStatus = {
  pending: 'pending',
  qualified: 'qualified',
  rewarded: 'rewarded',
  cancelled: 'cancelled'
} as const;
export type ReferralStatus = (typeof ReferralStatus)[keyof typeof ReferralStatus];

/** unit_type */
export const UnitType = {
  weight: 'weight',
  volume: 'volume',
  count: 'count'
} as const;
export type UnitType = (typeof UnitType)[keyof typeof UnitType];

/** wallet_direction */
export const WalletDirection = {
  credit: 'credit',
  debit: 'debit'
} as const;
export type WalletDirection = (typeof WalletDirection)[keyof typeof WalletDirection];

/** wallet_reference_type */
export const WalletReferenceType = {
  mission_completion: 'mission_completion',
  lottery_ticket: 'lottery_ticket',
  referral: 'referral',
  purchase: 'purchase',
  admin: 'admin'
} as const;
export type WalletReferenceType = (typeof WalletReferenceType)[keyof typeof WalletReferenceType];

/** wallet_transaction_type */
export const WalletTransactionType = {
  mission_reward: 'mission_reward',
  ticket_purchase: 'ticket_purchase',
  referral_bonus: 'referral_bonus',
  token_purchase: 'token_purchase',
  manual_adjustment: 'manual_adjustment'
} as const;
export type WalletTransactionType = (typeof WalletTransactionType)[keyof typeof WalletTransactionType];

/** Regroupe toutes les constantes (itération, tests, etc.) */
export const DatabaseEnums = {
  LotteryStatus,
  LotteryTicketStatus,
  MealType,
  MissionCompletionStatus,
  MissionStatus,
  MissionType,
  MissionValidationMode,
  ReferralStatus,
  UnitType,
  WalletDirection,
  WalletReferenceType,
  WalletTransactionType
} as const;
