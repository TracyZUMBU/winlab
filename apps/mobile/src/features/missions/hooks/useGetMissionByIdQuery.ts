import { useQuery } from "@tanstack/react-query";
import { getMissionById } from "../services/getMissionById";

export function useGetMissionByIdQuery(missionId: string | undefined) {
  return useQuery({
    queryKey: ["missions", missionId],
    queryFn: () => getMissionById(missionId!),
    enabled: !!missionId,
  });
}
