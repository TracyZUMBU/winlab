import { useInfiniteQuery } from "@tanstack/react-query";

import { missionListKeys } from "../queries/missionListKeys";
import type { PagedMissionCompletion } from "../services/getAvailableMissionsPage";
import { getCompletedMissionsPage } from "../services/getCompletedMissionsPage";
import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";

import type { AvailableMission, MissionUserStatus } from "./useTodoMissionsQuery";

const PAGE_SIZE = 15;

function completionStatusToUserStatus(
  status: PagedMissionCompletion["status"] | undefined,
): MissionUserStatus {
  switch (status) {
    case "approved":
      return "completed";
    case "pending":
      return "pending";
    case "rejected":
      return "rejected";
    default:
      return "completed";
  }
}

type UseCompletedMissionsQueryOptions = {
  /** When false, the query does not run (e.g. until the user opens the “completed” tab). */
  enabled?: boolean;
};

export function useCompletedMissionsQuery(
  options?: UseCompletedMissionsQueryOptions,
) {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;
  const queryEnabled = options?.enabled !== false;

  return useInfiniteQuery({
    queryKey: userId
      ? missionListKeys.completed(userId)
      : ["missions", "list", "completed", "none"],
    queryFn: ({ pageParam }) =>
      getCompletedMissionsPage({
        userId: userId!,
        pageIndex: pageParam ?? 0,
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.missions.length === PAGE_SIZE ? allPages.length : undefined,
    enabled: !!userId && queryEnabled,
    refetchOnWindowFocus: true,
    select: (data) =>
      data.pages.flatMap((page) => page.missions).map(
        (row): AvailableMission => ({
          ...row,
          userStatus: completionStatusToUserStatus(
            row.mission_completions[0]?.status,
          ),
        }),
      ),
  });
}
