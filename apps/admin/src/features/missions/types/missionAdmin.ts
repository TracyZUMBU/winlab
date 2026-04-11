/**
 * Types alignés sur les RPC `admin_get_missions`, `admin_get_missions_count`
 * et `admin_get_mission_detail`.
 * Les comptages bigint sont normalisés en `number` côté client.
 */

export const MISSION_ADMIN_STATUSES = [
  "draft",
  "active",
  "paused",
  "archived",
] as const;

export type MissionAdminKnownStatus = (typeof MISSION_ADMIN_STATUSES)[number];

/** Valeur d’enum Postgres `mission_status` ou valeur inattendue. */
export type MissionAdminStatus = MissionAdminKnownStatus | "unknown";

export const MISSION_ADMIN_TYPES = [
  "survey",
  "video",
  "follow",
  "referral",
  "custom",
] as const;

export type MissionAdminKnownType = (typeof MISSION_ADMIN_TYPES)[number];

/** Valeur d’enum Postgres `mission_type` ou valeur inattendue. */
export type MissionAdminType = MissionAdminKnownType | "unknown";

export const MISSION_ADMIN_VALIDATION_MODES = ["automatic", "manual"] as const;

export type MissionAdminKnownValidationMode =
  (typeof MISSION_ADMIN_VALIDATION_MODES)[number];

export type MissionAdminValidationMode =
  MissionAdminKnownValidationMode | "unknown";

/** Valeurs acceptées par `p_sort` dans `admin_get_missions` (liste blanche SQL). */
export const MISSION_ADMIN_LIST_SORT_IDS = [
  "created_at_desc",
  "created_at_asc",
  "starts_at_desc",
  "starts_at_asc",
  "ends_at_desc",
  "ends_at_asc",
  "title_asc",
  "title_desc",
  "token_reward_desc",
  "token_reward_asc",
  "total_completions_desc",
  "total_completions_asc",
] as const;

export type MissionAdminListSortId = (typeof MISSION_ADMIN_LIST_SORT_IDS)[number];

/** Filtres communs à `admin_get_missions` et `admin_get_missions_count`. */
export type AdminMissionsListFilters = {
  titleSearch?: string | null;
  brandId?: string | null;
  status?: MissionAdminKnownStatus | null;
  missionType?: MissionAdminKnownType | null;
};

export type GetAdminMissionsParams = AdminMissionsListFilters & {
  limit?: number;
  offset?: number;
  sort?: MissionAdminListSortId;
};

/** Entrée stable pour la query TanStack (liste + count missions). */
export type AdminMissionsListQueryInput = {
  titleSearch: string;
  brandId: string | null;
  status: "all" | MissionAdminKnownStatus;
  missionType: "all" | MissionAdminKnownType;
  limit: number;
  offset: number;
  sort: MissionAdminListSortId;
};

/** Ligne renvoyée par `admin_get_missions()`. */
export type AdminMissionListItem = {
  mission_id: string;
  title: string;
  brand_id: string;
  brand_name: string | null;
  mission_type: MissionAdminType;
  status: MissionAdminStatus;
  token_reward: number;
  validation_mode: MissionAdminValidationMode;
  starts_at: string | null;
  ends_at: string | null;
  total_completions: number;
};

/** Utilisateur distinct ayant au moins une complétion (élément de `completed_users`). */
export type AdminMissionCompletedUser = {
  user_id: string;
  username: string;
};

/** Détail admin : ligne `admin_get_mission_detail` + `completed_users` typés. */
export type AdminMissionDetail = {
  mission_id: string;
  title: string;
  description: string | null;
  brand_id: string;
  brand_name: string | null;
  mission_type: MissionAdminType;
  status: MissionAdminStatus;
  token_reward: number;
  validation_mode: MissionAdminValidationMode;
  starts_at: string | null;
  ends_at: string | null;
  max_completions_total: number | null;
  max_completions_per_user: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  total_completions: number;
  pending_completions: number;
  approved_completions: number;
  rejected_completions: number;
  completed_users: AdminMissionCompletedUser[];
};
