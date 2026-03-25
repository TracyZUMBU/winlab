import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";

import { getMyProfile } from "../services/getMyProfile";

export function useMyProfileQuery() {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["profile", "me", userId],
    queryFn: () => getMyProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });
}
