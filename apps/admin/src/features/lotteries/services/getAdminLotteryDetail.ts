import { getSupabaseClient } from "../../../lib/supabase";
import type { ServiceResult } from "../../../lib/api/serviceResult";
import { mapSupabaseToErrorCode } from "../../../lib/api/mapSupabaseToErrorCode";
import {
  LOTTERY_ADMIN_STATUSES,
  type AdminLotteryDetail,
  type AdminLotteryWinner,
  type LotteryAdminStatus,
} from "../types/lotteryAdmin";

const RPC_ADMIN_GET_LOTTERY_DETAIL = "admin_get_lottery_detail";

const STATUS_SET = new Set<string>(LOTTERY_ADMIN_STATUSES);

type AdminLotteryDetailRpcRow = {
  lottery_id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  status: string;
  category: string | null;
  slug: string | null;
  is_featured: boolean;
  ticket_cost: number;
  number_of_winners: number;
  starts_at: string | null;
  ends_at: string | null;
  draw_at: string;
  brand_name: string | null;
  tickets_count: number | string | null;
  winners_count: number | string | null;
  winners: unknown;
};

function parseStatus(raw: string): LotteryAdminStatus {
  return STATUS_SET.has(raw) ? (raw as LotteryAdminStatus) : "unknown";
}

function toNonNegativeInt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number.parseInt(value, 10);
    if (!Number.isNaN(n) && n >= 0) {
      return n;
    }
  }
  return 0;
}

function toOptionalString(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  return typeof value === "string" ? value : null;
}

function toRequiredString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }
  return null;
}

function parseWinnersJson(raw: unknown): AdminLotteryWinner[] {
  if (raw == null) {
    return [];
  }
  let arr: unknown = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) {
    return [];
  }

  const out: AdminLotteryWinner[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const o = item as Record<string, unknown>;
    const position = toInt(o.position);
    const userId = toRequiredString(o.user_id);
    const ticketId = toRequiredString(o.ticket_id);
    const createdAt = toRequiredString(o.created_at);
    if (position == null || userId == null || ticketId == null || createdAt == null) {
      continue;
    }
    out.push({
      position,
      user_id: userId,
      username: toOptionalString(o.username),
      email: toOptionalString(o.email),
      ticket_id: ticketId,
      created_at: createdAt,
    });
  }
  out.sort((a, b) => a.position - b.position);
  return out;
}

function mapDetailRow(row: AdminLotteryDetailRpcRow): AdminLotteryDetail | null {
  if (!row.lottery_id || !row.title || !row.draw_at) {
    return null;
  }
  return {
    lottery_id: row.lottery_id,
    title: row.title,
    description: row.description ?? null,
    short_description: row.short_description ?? null,
    status: parseStatus(row.status),
    category: row.category ?? null,
    slug: row.slug ?? null,
    is_featured: Boolean(row.is_featured),
    ticket_cost:
      typeof row.ticket_cost === "number" && !Number.isNaN(row.ticket_cost)
        ? row.ticket_cost
        : 0,
    number_of_winners:
      typeof row.number_of_winners === "number" && !Number.isNaN(row.number_of_winners)
        ? row.number_of_winners
        : 0,
    starts_at: row.starts_at ?? null,
    ends_at: row.ends_at ?? null,
    draw_at: row.draw_at,
    brand_name: row.brand_name ?? null,
    tickets_count: toNonNegativeInt(row.tickets_count),
    winners_count: toNonNegativeInt(row.winners_count),
    winners: parseWinnersJson(row.winners),
  };
}

/**
 * Détail d’une loterie via la RPC `admin_get_lottery_detail`.
 * `data: null` si aucune ligne (id inconnu). Accès refusé → `success: false`, `errorCode` adapté.
 */
export async function getAdminLotteryDetail(
  lotteryId: string,
): Promise<ServiceResult<AdminLotteryDetail | null>> {
  const trimmed = lotteryId.trim();
  if (!trimmed) {
    return { success: true, data: null };
  }

  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.rpc(RPC_ADMIN_GET_LOTTERY_DETAIL, {
      p_lottery_id: trimmed,
    });

    if (error) {
      return { success: false, errorCode: mapSupabaseToErrorCode(error) };
    }

    const rows = (Array.isArray(data) ? data : []) as AdminLotteryDetailRpcRow[];
    const first = rows[0];
    if (!first) {
      return { success: true, data: null };
    }

    const mapped = mapDetailRow(first);
    return { success: true, data: mapped };
  } catch (e) {
    return { success: false, errorCode: mapSupabaseToErrorCode(e) };
  }
}
