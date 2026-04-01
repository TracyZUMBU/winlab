import { getSupabaseClient } from "@/src/lib/supabase/client";

import type { HomeDashboardPayload } from "../types/homeDashboard";

import { parseHomeDashboardPayload } from "./parseHomeDashboardPayload";

export async function getUserHomeDashboard(): Promise<HomeDashboardPayload> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("get_user_home_dashboard");

  if (error) {
    throw error;
  }

  return parseHomeDashboardPayload(data);
}
