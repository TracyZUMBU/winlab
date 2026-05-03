/** Query keys for mission reads; keep in sync with mission query hooks. */
export const missionKeys = {
  all: ["missions"] as const,
  /** Inclut `userId` car les `mission_completions` embarquées dépendent du profil. */
  detail: (missionId: string, userId: string | null) =>
    [...missionKeys.all, "detail", missionId, userId ?? "anon"] as const,
};
