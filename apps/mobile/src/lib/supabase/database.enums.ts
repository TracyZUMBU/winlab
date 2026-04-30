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
export const LotteryStatusValues = {
  "draft": "draft",
  "active": "active",
  "closed": "closed",
  "drawn": "drawn",
  "cancelled": "cancelled"
} as const;
export type LotteryStatus = (typeof LotteryStatusValues)[keyof typeof LotteryStatusValues];

/** lottery_ticket_status */
export const LotteryTicketStatusValues = {
  "active": "active",
  "cancelled": "cancelled"
} as const;
export type LotteryTicketStatus = (typeof LotteryTicketStatusValues)[keyof typeof LotteryTicketStatusValues];

/** meal_type */
export const MealTypeValues = {
  "breakfast": "breakfast",
  "lunch": "lunch",
  "dinner": "dinner"
} as const;
export type MealType = (typeof MealTypeValues)[keyof typeof MealTypeValues];

/** mission_completion_status */
export const MissionCompletionStatusValues = {
  "pending": "pending",
  "approved": "approved",
  "rejected": "rejected"
} as const;
export type MissionCompletionStatus = (typeof MissionCompletionStatusValues)[keyof typeof MissionCompletionStatusValues];

/** mission_status */
export const MissionStatusValues = {
  "draft": "draft",
  "active": "active",
  "paused": "paused",
  "archived": "archived"
} as const;
export type MissionStatus = (typeof MissionStatusValues)[keyof typeof MissionStatusValues];

/** mission_type */
export const MissionTypeValues = {
  "survey": "survey",
  "video": "video",
  "follow": "follow",
  "referral": "referral",
  "custom": "custom",
  "daily_login": "daily_login"
} as const;
export type MissionType = (typeof MissionTypeValues)[keyof typeof MissionTypeValues];

/** mission_validation_mode */
export const MissionValidationModeValues = {
  "automatic": "automatic",
  "manual": "manual"
} as const;
export type MissionValidationMode = (typeof MissionValidationModeValues)[keyof typeof MissionValidationModeValues];

/** referral_status */
export const ReferralStatusValues = {
  "pending": "pending",
  "qualified": "qualified",
  "rewarded": "rewarded",
  "cancelled": "cancelled"
} as const;
export type ReferralStatus = (typeof ReferralStatusValues)[keyof typeof ReferralStatusValues];

/** unit_type */
export const UnitTypeValues = {
  "weight": "weight",
  "volume": "volume",
  "count": "count"
} as const;
export type UnitType = (typeof UnitTypeValues)[keyof typeof UnitTypeValues];

/** wallet_direction */
export const WalletDirectionValues = {
  "credit": "credit",
  "debit": "debit"
} as const;
export type WalletDirection = (typeof WalletDirectionValues)[keyof typeof WalletDirectionValues];

/** wallet_reference_type */
export const WalletReferenceTypeValues = {
  "mission_completion": "mission_completion",
  "lottery_ticket": "lottery_ticket",
  "referral": "referral",
  "purchase": "purchase",
  "admin": "admin"
} as const;
export type WalletReferenceType = (typeof WalletReferenceTypeValues)[keyof typeof WalletReferenceTypeValues];

/** wallet_transaction_type */
export const WalletTransactionTypeValues = {
  "mission_reward": "mission_reward",
  "ticket_purchase": "ticket_purchase",
  "referral_bonus": "referral_bonus",
  "token_purchase": "token_purchase",
  "manual_adjustment": "manual_adjustment"
} as const;
export type WalletTransactionType = (typeof WalletTransactionTypeValues)[keyof typeof WalletTransactionTypeValues];

/** Regroupe toutes les constantes (itération, tests, etc.) */
export const DatabaseEnums = {
  LotteryStatus: LotteryStatusValues,
  LotteryTicketStatus: LotteryTicketStatusValues,
  MealType: MealTypeValues,
  MissionCompletionStatus: MissionCompletionStatusValues,
  MissionStatus: MissionStatusValues,
  MissionType: MissionTypeValues,
  MissionValidationMode: MissionValidationModeValues,
  ReferralStatus: ReferralStatusValues,
  UnitType: UnitTypeValues,
  WalletDirection: WalletDirectionValues,
  WalletReferenceType: WalletReferenceTypeValues,
  WalletTransactionType: WalletTransactionTypeValues
} as const;
