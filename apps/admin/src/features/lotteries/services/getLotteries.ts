import { getSupabaseClient } from "../../../lib/supabase";
import {
  LOTTERY_ADMIN_STATUSES,
  type GetLotteriesResult,
  type LotteryAdminListItem,
  type LotteryAdminStatus,
} from "../types/lotteryAdmin";

const RPC_ADMIN_GET_LOTTERIES = "admin_get_lotteries";

const LOTTERY_STATUS_SET = new Set<string>(LOTTERY_ADMIN_STATUSES);

/** Ligne telle que renvoyée par la RPC `admin_get_lotteries()` (PostgREST). */
type AdminLotteriesOverviewRow = {
  lottery_id: string;
  title: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  draw_at: string;
  ticket_cost: number;
  number_of_winners: number;
  brand_name: string | null;
  tickets_count: number | string | null;
  winners_count: number | string | null;
};

function parseLotteryStatus(raw: unknown): LotteryAdminStatus {
  if (typeof raw === "string" && LOTTERY_STATUS_SET.has(raw)) {
    return raw as LotteryAdminStatus;
  }
  return "unknown";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** Normalise un entier non négatif (bigint / string possibles selon le client). */
function toNonNegativeInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return fallback;
}

function mapOverviewRowToListItem(
  row: AdminLotteriesOverviewRow,
): LotteryAdminListItem | null {
  if (!isNonEmptyString(row.lottery_id)) {
    return null;
  }
  if (!isNonEmptyString(row.title)) {
    return null;
  }
  if (!isNonEmptyString(row.draw_at)) {
    return null;
  }
  if (typeof row.ticket_cost !== "number" || Number.isNaN(row.ticket_cost)) {
    return null;
  }
  if (
    typeof row.number_of_winners !== "number" ||
    Number.isNaN(row.number_of_winners) ||
    !Number.isFinite(row.number_of_winners) ||
    row.number_of_winners < 0
  ) {
    return null;
  }

  const starts_at =
    row.starts_at === null || row.starts_at === undefined
      ? null
      : typeof row.starts_at === "string"
        ? row.starts_at
        : null;
  const ends_at =
    row.ends_at === null || row.ends_at === undefined
      ? null
      : typeof row.ends_at === "string"
        ? row.ends_at
        : null;

  const brand_name =
    row.brand_name === null || row.brand_name === undefined
      ? null
      : typeof row.brand_name === "string"
        ? row.brand_name
        : null;

  return {
    id: row.lottery_id,
    title: row.title,
    status: parseLotteryStatus(row.status),
    starts_at,
    ends_at,
    draw_at: row.draw_at,
    ticket_cost: row.ticket_cost,
    number_of_winners: row.number_of_winners,
    brand_name,
    tickets_count: toNonNegativeInt(row.tickets_count, 0),
    winners_count: toNonNegativeInt(row.winners_count, 0),
  };
}

/**
 * Liste les loteries via la RPC `admin_get_lotteries()` (SECURITY DEFINER + garde admin en base).
 * Les lignes invalides sont ignorées ; erreur PostgREST : log console + propagation.
 */
export async function getLotteries(): Promise<GetLotteriesResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc(RPC_ADMIN_GET_LOTTERIES);

  if (error) {
    console.error("[getLotteries] admin_get_lotteries", error.message, error);
    throw new Error(`getLotteries: ${error.message}`, { cause: error });
  }

  const rows = (data ?? []) as AdminLotteriesOverviewRow[];
  const lotteries: LotteryAdminListItem[] = [];

  for (const raw of rows) {
    const item = mapOverviewRowToListItem(raw);
    if (item) {
      lotteries.push(item);
    }
  }

  return { lotteries };
}
