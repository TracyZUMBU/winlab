import type { Database } from "./databaseTypes";
import { createClient } from "@supabase/supabase-js";

// Read env at call time: the package barrel is loaded from Jest setupFiles before
// loadIntegrationTestEnv() runs, so module-level env capture would stay undefined.
function getSupabaseTestEnv(): {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
} {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY. For Jest integration tests, use loadIntegrationTestEnv in setupFiles (e.g. apps/admin/tests/setupEnv.ts) and apps/admin/.env.test.local.",
    );
  }
  return { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey };
}

export const getSupabaseAdminClient = () => {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseTestEnv();
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export const getSupabaseAnonClient = () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseTestEnv();
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};
