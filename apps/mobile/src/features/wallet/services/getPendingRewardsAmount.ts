import { getSupabaseClient } from "@/src/lib/supabase/client";

type PendingCompletionRewardRow = {
  missions: { token_reward: number } | null;
};

export async function getPendingRewardsAmount(userId: string): Promise<number> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("mission_completions")
    .select("missions(token_reward)")
    .eq("user_id", userId)
    .eq("status", "pending");

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as PendingCompletionRewardRow[];
  return rows.reduce((sum, row) => sum + (row.missions?.token_reward ?? 0), 0);
}
