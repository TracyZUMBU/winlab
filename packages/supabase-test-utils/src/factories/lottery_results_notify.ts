import { getSupabaseAdminClient } from "../supabaseTestClient";

export type LotteryResultsNotifyRunRow = {
  id: string;
  started_at: string;
  finished_at: string | null;
};

export type LotteryResultsNotifyRunItemRow = {
  id: string;
  run_id: string;
  lottery_id: string;
  status: string;
};

/**
 * Tables générées hors `Database` types mobile tant que `supabase gen types` n’est pas relancé.
 */
function adminAny() {
  return getSupabaseAdminClient() as any;
}

export async function createLotteryResultsNotifyRun(
  overrides: Partial<{ finished_at: string | null }> = {},
): Promise<LotteryResultsNotifyRunRow> {
  const admin = adminAny();
  const { data, error } = await admin
    .from("lottery_results_notify_runs")
    .insert({ ...overrides })
    .select("id, started_at, finished_at")
    .single();
  if (error) throw error;
  return data as LotteryResultsNotifyRunRow;
}

export async function createLotteryResultsNotifyRunItem(input: {
  run_id: string;
  lottery_id: string;
  status?: "pending" | "completed" | "failed";
}): Promise<LotteryResultsNotifyRunItemRow> {
  const admin = adminAny();
  const { data, error } = await admin
    .from("lottery_results_notify_run_items")
    .insert({
      run_id: input.run_id,
      lottery_id: input.lottery_id,
      status: input.status ?? "pending",
    })
    .select("id, run_id, lottery_id, status")
    .single();
  if (error) throw error;
  return data as LotteryResultsNotifyRunItemRow;
}
