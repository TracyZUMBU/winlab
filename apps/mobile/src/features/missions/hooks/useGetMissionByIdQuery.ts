import { useQuery } from "@tanstack/react-query";

import { useAuthSession } from "@/src/features/auth/hooks/useAuthSession";

import { missionKeys } from "../queries/missionKeys";
import { getMissionById } from "../services/getMissionById";

export function useGetMissionByIdQuery(missionId: string | undefined) {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: missionId
      ? missionKeys.detail(missionId, userId)
      : ([...missionKeys.all, "detail", "idle"] as const),
    queryFn: () => getMissionById(missionId!),
    enabled: Boolean(missionId),
  });
}
