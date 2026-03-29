import { useInfiniteQuery } from "@tanstack/react-query";

import { missionListKeys } from "../queries/missionListKeys";
import {
  getAvailableMissionsPage,
  type PagedMissionRow,
} from "../services/getAvailableMissionsPage";
import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";

export type MissionUserStatus =
  | "available"
  | "pending"
  | "completed"
  | "rejected";

export type AvailableMission = PagedMissionRow & {
  userStatus: MissionUserStatus;
};

function mapRowToMission(row: PagedMissionRow): AvailableMission {
  const completion = row.mission_completions[0];
  let userStatus: MissionUserStatus = "available";
  if (completion) {
    if (completion.status === "approved") userStatus = "completed";
    else if (completion.status === "pending") userStatus = "pending";
    else if (completion.status === "rejected") userStatus = "rejected";
  }
  return {
    ...row,
    userStatus,
  };
}

const PAGE_SIZE = 15;

export function useTodoMissionsQuery() {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  return useInfiniteQuery({
    queryKey: userId ? missionListKeys.todo(userId) : ["missions", "list", "todo", "none"],
    queryFn: ({ pageParam }) =>
      getAvailableMissionsPage({
        userId: userId!,
        pageIndex: pageParam ?? 0,
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.missions.length === PAGE_SIZE ? allPages.length : undefined,
    enabled: !!userId,
    refetchOnWindowFocus: true,
    select: (data) => {
      const flat = data.pages.flatMap((page) => page.missions);
      return flat.map(mapRowToMission);
    },
  });
}
