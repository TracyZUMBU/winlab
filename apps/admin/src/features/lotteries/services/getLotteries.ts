import { getSupabaseClient } from "../../../lib/supabase";
import {
  LOTTERY_ADMIN_STATUSES,
  type GetLotteriesResult,
  type LotteryAdminListItem,
  type LotteryAdminStatus,
} from "../types/lotteryAdmin";

const LOTTERY_STATUS_SET = new Set<string>(LOTTERY_ADMIN_STATUSES);

type LotteryListDbRow = {
  id: string;
  title: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  draw_at: string;
  ticket_cost: number;
  number_of_winners: number;
  brand_id: string;
  brand: { name: string } | { name: string }[] | null;
};

function parseLotteryStatus(raw: unknown): LotteryAdminStatus {
  if (typeof raw === "string" && LOTTERY_STATUS_SET.has(raw)) {
    return raw as LotteryAdminStatus;
  }
  return "unknown";
}

function readBrandName(brand: LotteryListDbRow["brand"]): string | null {
  if (brand == null) {
    return null;
  }
  if (Array.isArray(brand)) {
    const first = brand[0];
    return typeof first?.name === "string" ? first.name : null;
  }
  return typeof brand.name === "string" ? brand.name : null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function mapRowToListItem(row: LotteryListDbRow): LotteryAdminListItem | null {
  if (!isNonEmptyString(row.id)) {
    return null;
  }
  if (!isNonEmptyString(row.title)) {
    return null;
  }
  if (!isNonEmptyString(row.draw_at)) {
    return null;
  }
  if (!isNonEmptyString(row.brand_id)) {
    return null;
  }
  if (typeof row.ticket_cost !== "number" || Number.isNaN(row.ticket_cost)) {
    return null;
  }
  if (
    typeof row.number_of_winners !== "number" ||
    Number.isNaN(row.number_of_winners) ||
    !Number.isFinite(row.number_of_winners)
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

  return {
    id: row.id,
    title: row.title,
    status: parseLotteryStatus(row.status),
    starts_at,
    ends_at,
    draw_at: row.draw_at,
    ticket_cost: row.ticket_cost,
    number_of_winners: row.number_of_winners,
    brand_id: row.brand_id,
    brand_name: readBrandName(row.brand),
  };
}

/**
 * Liste les loteries pour l’admin (lecture seule, clé anon + RLS).
 * Les lignes invalides sont ignorées plutôt que de faire échouer toute la liste.
 */
export async function getLotteries(): Promise<GetLotteriesResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("lotteries")
    .select(
      `
      id,
      title,
      status,
      starts_at,
      ends_at,
      draw_at,
      ticket_cost,
      number_of_winners,
      brand_id,
      brand:brands ( name )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`getLotteries: ${error.message}`, { cause: error });
  }

  const rows = (data ?? []) as LotteryListDbRow[];
  const lotteries: LotteryAdminListItem[] = [];

  for (const raw of rows) {
    const item = mapRowToListItem(raw);
    if (item) {
      lotteries.push(item);
    }
  }

  return { lotteries };
}
