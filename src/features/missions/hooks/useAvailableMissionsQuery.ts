import { useInfiniteQuery } from "@tanstack/react-query";

import {
  getAvailableMissionsPage,
  type PagedMissionRow,
} from "../services/getAvailableMissionsPage";
import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";

export type MissionUserStatus = "available" | "pending" | "completed";

export type AvailableMission = PagedMissionRow & {
  userStatus: MissionUserStatus;
};

function mapRowToMission(row: PagedMissionRow): AvailableMission {
  const completion = row.mission_completions[0];
  let userStatus: MissionUserStatus = "available";
  if (completion) {
    if (completion.status === "approved") userStatus = "completed";
    else if (completion.status === "pending" || completion.status === "rejected")
      userStatus = "pending";
  }
  return {
    ...row,
    userStatus,
  };
}

const QUERY_KEY = ["missions", "available"] as const;

export function useAvailableMissionsQuery() {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  const query = useInfiniteQuery({
    queryKey: [...QUERY_KEY, userId],
    queryFn: ({ pageParam }) =>
      getAvailableMissionsPage({
        userId: userId!,
        pageIndex: pageParam ?? 0,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.missions.length === 15 ? allPages.length : undefined,
    enabled: !!userId,
    refetchOnWindowFocus: true,
    select: (data) => {
      const flat = data.pages.flatMap((page) => page.missions);
      return flat.map(mapRowToMission);
    },
  });

  return query;
}
