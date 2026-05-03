import {
  createAuthenticatedTestUser,
  createBrand,
  createLottery,
  createLotteryResultsNotifyRun,
  createLotteryResultsNotifyRunItem,
  createLotteryTickets,
  getSupabaseAdminClient,
} from "@winlab/supabase-test-utils";

const PENDING_PUSH = "lottery_drawn_ids_pending_results_push" as any;
const USER_IDS = "lottery_results_notify_distinct_participant_user_ids" as any;
const START_BATCH = "lottery_results_notify_start_batch" as any;
const FINALIZE_RUN = "lottery_results_notify_finalize_run" as any;

describe("lottery results notify SQL helpers (integration)", () => {
  it("lottery_drawn_ids_pending_results_push includes drawn lottery without completed notify item", async () => {
    const admin = getSupabaseAdminClient() as any;
    const brand = await createBrand();
    const lottery = await createLottery({
      brand_id: brand.id,
      status: "closed",
      ends_at: new Date(Date.now() - 20_000).toISOString(),
      draw_at: new Date(Date.now() - 10_000).toISOString(),
    });

    const { error: runLotteryErr } = await admin.rpc("run_lottery", {
      p_lottery_id: lottery.id,
    });
    expect(runLotteryErr).toBeNull();

    const { data, error } = await admin.rpc(PENDING_PUSH, {
      p_max: 100,
    });
    expect(error).toBeNull();
    const ids = (data ?? []) as string[];
    expect(ids).toContain(lottery.id);
  });

  it("lottery_drawn_ids_pending_results_push excludes lottery while pending item on unfinished run", async () => {
    const admin = getSupabaseAdminClient() as any;
    const brand = await createBrand();
    const lottery = await createLottery({
      brand_id: brand.id,
      status: "closed",
      ends_at: new Date(Date.now() - 30_000).toISOString(),
      draw_at: new Date(Date.now() - 20_000).toISOString(),
    });

    const { error: runLotteryErr } = await admin.rpc("run_lottery", {
      p_lottery_id: lottery.id,
    });
    expect(runLotteryErr).toBeNull();

    const { data: batch, error: batchErr } = await admin.rpc(START_BATCH, {
      p_max: 50,
    });
    expect(batchErr).toBeNull();
    expect(batch?.run_id).toBeTruthy();
    expect(batch?.lottery_ids).toContain(lottery.id);

    const { data: ids, error } = await admin.rpc(PENDING_PUSH, {
      p_max: 200,
    });
    expect(error).toBeNull();
    expect((ids ?? []) as string[]).not.toContain(lottery.id);

    const { count, error: cntErr } = await admin
      .from("lottery_results_notify_run_items")
      .select("*", { count: "exact", head: true })
      .eq("lottery_id", lottery.id)
      .eq("status", "pending");
    expect(cntErr).toBeNull();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("lottery_results_notify_finalize_run completes pending items and sets run finished_at", async () => {
    const admin = getSupabaseAdminClient() as any;
    const brand = await createBrand();
    const lottery = await createLottery({
      brand_id: brand.id,
      status: "closed",
      ends_at: new Date(Date.now() - 35_000).toISOString(),
      draw_at: new Date(Date.now() - 25_000).toISOString(),
    });

    const { error: runLotteryErr } = await admin.rpc("run_lottery", {
      p_lottery_id: lottery.id,
    });
    expect(runLotteryErr).toBeNull();

    const { data: batch, error: batchErr } = await admin.rpc(START_BATCH, {
      p_max: 50,
    });
    expect(batchErr).toBeNull();
    const runId = batch?.run_id as string;
    expect(runId).toBeTruthy();

    const { data: finData, error: finErr } = await admin.rpc(FINALIZE_RUN, {
      p_run_id: runId,
    });
    expect(finErr).toBeNull();
    expect(finData?.no_op).toBe(false);
    expect(finData?.run_found).toBe(true);
    expect(finData?.affected_items_count).toBeGreaterThanOrEqual(1);
    expect(finData?.updated_runs_count).toBe(1);

    const { data: run, error: runErr } = await admin
      .from("lottery_results_notify_runs")
      .select("finished_at")
      .eq("id", runId)
      .single();
    expect(runErr).toBeNull();
    expect(run?.finished_at).toBeTruthy();

    const { data: item, error: itemErr } = await admin
      .from("lottery_results_notify_run_items")
      .select("status")
      .eq("run_id", runId)
      .eq("lottery_id", lottery.id)
      .maybeSingle();
    expect(itemErr).toBeNull();
    expect(item?.status).toBe("completed");
  });

  it("lottery_results_notify_finalize_run returns no_op on second finalize", async () => {
    const admin = getSupabaseAdminClient() as any;
    const brand = await createBrand();
    const lottery = await createLottery({
      brand_id: brand.id,
      status: "closed",
      ends_at: new Date(Date.now() - 40_000).toISOString(),
      draw_at: new Date(Date.now() - 30_000).toISOString(),
    });

    const { error: runLotteryErr } = await admin.rpc("run_lottery", {
      p_lottery_id: lottery.id,
    });
    expect(runLotteryErr).toBeNull();

    const { data: batch, error: batchErr } = await admin.rpc(START_BATCH, {
      p_max: 50,
    });
    expect(batchErr).toBeNull();
    const runId = batch?.run_id as string;
    expect(runId).toBeTruthy();

    const { error: fin1Err } = await admin.rpc(FINALIZE_RUN, {
      p_run_id: runId,
    });
    expect(fin1Err).toBeNull();

    const { data: fin2, error: fin2Err } = await admin.rpc(FINALIZE_RUN, {
      p_run_id: runId,
    });
    expect(fin2Err).toBeNull();
    expect(fin2?.no_op).toBe(true);
    expect(fin2?.run_found).toBe(true);
    expect(fin2?.affected_items_count).toBe(0);
    expect(fin2?.updated_runs_count).toBe(0);
  });

  it("lottery_drawn_ids_pending_results_push excludes lottery after completed notify item", async () => {
    const admin = getSupabaseAdminClient() as any;
    const brand = await createBrand();
    const lottery = await createLottery({
      brand_id: brand.id,
      status: "closed",
      ends_at: new Date(Date.now() - 25_000).toISOString(),
      draw_at: new Date(Date.now() - 15_000).toISOString(),
    });

    const { error: runLotteryErr } = await admin.rpc("run_lottery", {
      p_lottery_id: lottery.id,
    });
    expect(runLotteryErr).toBeNull();

    const run = await createLotteryResultsNotifyRun();
    await createLotteryResultsNotifyRunItem({
      run_id: run.id,
      lottery_id: lottery.id,
      status: "completed",
    });

    const { data, error } = await admin.rpc(PENDING_PUSH, {
      p_max: 200,
    });
    expect(error).toBeNull();
    const ids = (data ?? []) as string[];
    expect(ids).not.toContain(lottery.id);
  });

  it("lottery_results_notify_distinct_participant_user_ids dedupes active ticket holders", async () => {
    const admin = getSupabaseAdminClient() as any;
    const brand = await createBrand();
    const u1 = await createAuthenticatedTestUser();
    const u2 = await createAuthenticatedTestUser();
    const lottery = await createLottery({
      brand_id: brand.id,
      status: "active",
      ends_at: new Date(Date.now() + 3_600_000).toISOString(),
      draw_at: new Date(Date.now() + 7_200_000).toISOString(),
    });

    await createLotteryTickets([
      { lottery_id: lottery.id, user_id: u1.userId, status: "active" },
      { lottery_id: lottery.id, user_id: u2.userId, status: "active" },
      { lottery_id: lottery.id, user_id: u1.userId, status: "active" },
    ]);

    const { data, error } = await admin.rpc(USER_IDS, {
      p_lottery_ids: [lottery.id],
    });
    expect(error).toBeNull();
    const rows = (data ?? []) as { user_id: string }[];
    const set = new Set(rows.map((r) => r.user_id));
    expect(set.size).toBe(2);
    expect(set.has(u1.userId)).toBe(true);
    expect(set.has(u2.userId)).toBe(true);
  });
});
