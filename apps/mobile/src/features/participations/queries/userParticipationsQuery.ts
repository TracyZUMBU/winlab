import { infiniteQueryOptions } from "@tanstack/react-query";

import {
  getUserParticipationsPage,
  USER_PARTICIPATIONS_PAGE_SIZE,
} from "../services/getUserParticipationsPage";
import { participationKeys } from "./participationKeys";

export function userParticipationsInfiniteOptions(userId: string | null) {
  return infiniteQueryOptions({
    queryKey: userId
      ? participationKeys.list(userId)
      : participationKeys.anonymous(),
    queryFn: ({ pageParam }) =>
      getUserParticipationsPage({
        pageIndex: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.participations.length === USER_PARTICIPATIONS_PAGE_SIZE
        ? allPages.length
        : undefined,
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
