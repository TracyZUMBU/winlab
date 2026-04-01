import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";

import { homeDashboardKeys } from "../queries/homeDashboardKeys";
import { getUserHomeDashboard } from "../services/getUserHomeDashboard";

export function useHomeDashboardQuery() {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: userId ? homeDashboardKeys.detail(userId) : homeDashboardKeys.all,
    queryFn: getUserHomeDashboard,
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });
}
