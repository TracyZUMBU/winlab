import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import {
  createAuthenticatedTestUser,
  getSupabaseAdminClient,
} from "@winlab/supabase-test-utils";

const functionsUrl = `${process.env.SUPABASE_URL}/functions/v1`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function isFunctionsServeUp(): Promise<boolean> {
  try {
    const res = await fetch(`${functionsUrl}/delete-my-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    // "Up" means the function runtime is reachable and can execute the handler.
    // 503 from gateway (e.g. name resolution/runtime issue) should be treated as "not up".
    return [200, 401, 403, 405].includes(res.status);
  } catch {
    return false;
  }
}

async function ensureFunctionsServe(): Promise<{
  proc: ChildProcessWithoutNullStreams | null;
}> {
  if (await isFunctionsServeUp()) return { proc: null };

  const repoRoot = path.resolve(__dirname, "../../../..");
  const proc = spawn("supabase", ["functions", "serve"], {
    cwd: repoRoot,
    stdio: "pipe",
    env: process.env,
  });

  const startedAt = Date.now();
  while (Date.now() - startedAt < 20_000) {
    if (await isFunctionsServeUp()) return { proc };
    await sleep(500);
  }

  proc.kill("SIGTERM");
  throw new Error("Failed to start supabase functions serve");
}

describe("delete-my-account Edge Function (integration)", () => {
  let functionsProc: ChildProcessWithoutNullStreams | null = null;

  beforeAll(async () => {
    const started = await ensureFunctionsServe();
    functionsProc = started.proc;
  });

  afterAll(async () => {
    if (!functionsProc) return;
    functionsProc.kill("SIGTERM");
    functionsProc = null;
  });

  it("anonymizes profile and soft-deletes auth user", async () => {
    const admin = getSupabaseAdminClient();
    const testUser = await createAuthenticatedTestUser();

    const { data: sessionData, error: sessionError } =
      await testUser.client.auth.getSession();
    expect(sessionError).toBeNull();
    expect(sessionData.session?.access_token).toBeTruthy();

    const accessToken = sessionData.session!.access_token;

    const beforeProfile = await admin
      .from("profiles")
      .select("id,email,username,referral_code")
      .eq("id", testUser.userId)
      .single();

    expect(beforeProfile.error).toBeNull();
    expect(beforeProfile.data?.email).toBe(testUser.email);
    expect(beforeProfile.data?.username).toBeTruthy();
    expect(beforeProfile.data?.referral_code).toBeTruthy();

    const res = await fetch(`${functionsUrl}/delete-my-account`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });

    const responseText = await res.text();
    const parsedResponse = responseText ? JSON.parse(responseText) : null;
    if (!res.ok) {
      throw new Error(
        `delete-my-account failed with status=${res.status} body=${responseText}`,
      );
    }
    expect(parsedResponse).toEqual({ success: true });

    const afterProfile = await admin
      .from("profiles")
      .select("id,email,username,referral_code")
      .eq("id", testUser.userId)
      .single();

    expect(afterProfile.error).toBeNull();
    expect(afterProfile.data?.email).toBe(
      `deleted-${testUser.userId}@deleted.local`,
    );
    expect(afterProfile.data?.username).toBe(
      `deleted_${testUser.userId.replaceAll("-", "").slice(0, 12)}`,
    );
    expect(afterProfile.data?.referral_code).toBeNull();

    // Verify Auth soft delete via Admin HTTP endpoint (deleted_at set).
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const authRes = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/admin/users/${testUser.userId}`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      },
    );
    expect(authRes.ok).toBe(true);
    const authUser = (await authRes.json()) as { deleted_at?: string | null };
    expect(authUser.deleted_at).toBeTruthy();
  });
});

