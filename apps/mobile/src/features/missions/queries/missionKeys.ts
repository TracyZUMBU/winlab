/** Query keys for mission reads; keep in sync with mission query hooks. */
export const missionKeys = {
  all: ["missions"] as const,
  /** Must match `useGetMissionByIdQuery` */
  detail: (missionId: string) => [...missionKeys.all, missionId] as const,
};
