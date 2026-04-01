import type { Enums } from "@/src/lib/supabase.types";
import { getSupabaseClient } from "@/src/lib/supabase/client";

export type PagedMissionBrand = {
  id: string;
  name: string;
  logo_url: string | null;
};

export type PagedMissionCompletion = {
  id: string;
  status: Enums<"mission_completion_status">;
  user_id: string;
};

export type PagedMissionRow = {
  id: string;
  image_url: string | null;
  title: string;
  description: string | null;
  mission_type: Enums<"mission_type">;
  token_reward: number;
  ends_at: string | null;
  brand: PagedMissionBrand | null;
  mission_completions: PagedMissionCompletion[];
};

export type GetAvailableMissionsPageParams = {
  userId: string;
  pageIndex: number;
  pageSize?: number;
};

export type GetAvailableMissionsPageResult = {
  missions: PagedMissionRow[];
};

const DEFAULT_PAGE_SIZE = 15;

function parseBrandFromRpc(value: unknown): PagedMissionBrand | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const o = value as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.name !== "string") {
    return null;
  }
  return {
    id: o.id,
    name: o.name,
    logo_url: typeof o.logo_url === "string" ? o.logo_url : null,
  };
}

function parseCompletionsFromRpc(value: unknown): PagedMissionCompletion[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is PagedMissionCompletion =>
      !!item &&
      typeof item === "object" &&
      typeof (item as PagedMissionCompletion).id === "string" &&
      typeof (item as PagedMissionCompletion).status === "string" &&
      typeof (item as PagedMissionCompletion).user_id === "string",
  );
}

export async function getAvailableMissionsPage(
  params: GetAvailableMissionsPageParams,
): Promise<GetAvailableMissionsPageResult> {
  const { pageIndex, pageSize = DEFAULT_PAGE_SIZE } = params;
  const supabase = getSupabaseClient();

  const from = pageIndex * pageSize;
  const to = from + pageSize - 1;
  const limit = to - from + 1;
  const offset = from;

  const { data, error } = await supabase.rpc("get_todo_missions_page", {
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    throw error;
  }

  const rows = data ?? [];

  return {
    missions: rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      mission_type: row.mission_type,
      token_reward: row.token_reward,
      ends_at: row.ends_at,
      image_url: row.image_url,
      brand: parseBrandFromRpc(row.brand),
      mission_completions: parseCompletionsFromRpc(row.mission_completions),
    })),
  };
}
