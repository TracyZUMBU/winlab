import { mapSupabaseToErrorCode } from "../../../lib/api/mapSupabaseToErrorCode";
import type { ServiceResult } from "../../../lib/api/serviceResult";
import { getSupabaseClient } from "../../../lib/supabase";
import {
  LOTTERY_CREATE_STATUSES,
  type CreateAdminLotteryInput,
  type CreatedAdminLottery,
  type LotteryCreateStatus,
} from "../types/lotteryAdmin";

const RPC_ADMIN_CREATE_LOTTERY = "admin_create_lottery";

const CREATE_STATUS_SET = new Set<string>(LOTTERY_CREATE_STATUSES);

function isValidCreateStatus(value: string): value is LotteryCreateStatus {
  return CREATE_STATUS_SET.has(value);
}

type CreateLotteryRpcResult = {
  lottery_id?: unknown;
  slug?: unknown;
};

/**
 * Crée une loterie via la RPC `admin_create_lottery` (garde admin en base).
 */
export async function createAdminLottery(
  input: CreateAdminLotteryInput,
): Promise<ServiceResult<CreatedAdminLottery>> {
  try {
    if (
      input.brand_id == null ||
      typeof input.brand_id !== "string" ||
      input.brand_id.trim().length === 0 ||
      input.title == null ||
      typeof input.title !== "string" ||
      input.title.trim().length === 0 ||
      input.ends_at == null ||
      typeof input.ends_at !== "string" ||
      input.ends_at.trim().length === 0 ||
      input.draw_at == null ||
      typeof input.draw_at !== "string" ||
      input.draw_at.trim().length === 0
    ) {
      return { success: false, errorCode: "INVALID_PAYLOAD" };
    }

    const brand_id = input.brand_id.trim();
    const title = input.title.trim();
    const ends_at = input.ends_at.trim();
    const draw_at = input.draw_at.trim();

    if (
      typeof input.ticket_cost !== "number" ||
      !Number.isInteger(input.ticket_cost) ||
      input.ticket_cost <= 0
    ) {
      return { success: false, errorCode: "INVALID_TICKET_COST" };
    }

    if (
      typeof input.number_of_winners !== "number" ||
      !Number.isInteger(input.number_of_winners) ||
      input.number_of_winners <= 0
    ) {
      return { success: false, errorCode: "INVALID_NUMBER_OF_WINNERS" };
    }

    const status = String(input.status);
    if (!isValidCreateStatus(status)) {
      return { success: false, errorCode: "INVALID_LOTTERY_STATUS" };
    }

    const starts_at =
      input.starts_at === null || input.starts_at === undefined
        ? null
        : String(input.starts_at).trim() || null;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc(RPC_ADMIN_CREATE_LOTTERY, {
      p_brand_id: brand_id,
      p_title: title,
      p_ticket_cost: input.ticket_cost,
      p_number_of_winners: input.number_of_winners,
      p_ends_at: ends_at,
      p_draw_at: draw_at,
      p_starts_at: starts_at,
      p_status: status,
      p_description: input.description ?? null,
      p_short_description: input.short_description ?? null,
      p_category: input.category ?? null,
      p_image_url: input.image_url ?? null,
      p_is_featured: input.is_featured ?? false,
    });

    if (error) {
      return { success: false, errorCode: mapSupabaseToErrorCode(error) };
    }

    const payload = data as CreateLotteryRpcResult | null;
    const id =
      typeof payload?.lottery_id === "string" ? payload.lottery_id : "";
    const slug = typeof payload?.slug === "string" ? payload.slug : "";

    if (id.length === 0) {
      return { success: false, errorCode: "UNKNOWN" };
    }

    return {
      success: true,
      data: { id, slug },
    };
  } catch (e) {
    return { success: false, errorCode: mapSupabaseToErrorCode(e) };
  }
}
