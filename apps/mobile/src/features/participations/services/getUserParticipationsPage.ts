import { getSupabaseClient } from "@/src/lib/supabase/client";

import type {
  GetUserParticipationsPageParams,
  GetUserParticipationsPageResult,
  UserParticipationRow,
} from "../types/userParticipation";
import { parseUserParticipationRpcRow } from "./parseUserParticipationRpcRow";

export const USER_PARTICIPATIONS_PAGE_SIZE = 15;

export async function getUserParticipationsPage(
  params: GetUserParticipationsPageParams,
): Promise<GetUserParticipationsPageResult> {
  const { pageIndex, pageSize = USER_PARTICIPATIONS_PAGE_SIZE } = params;
  const supabase = getSupabaseClient();

  const offset = pageIndex * pageSize;

  const { data, error } = await supabase.rpc("get_user_participations", {
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  const participations: UserParticipationRow[] = [];

  for (const row of rows) {
    const parsed = parseUserParticipationRpcRow(row);
    if (!parsed) {
      throw new Error("get_user_participations returned an invalid row");
    }
    participations.push(parsed);
  }

  return { participations };
}
