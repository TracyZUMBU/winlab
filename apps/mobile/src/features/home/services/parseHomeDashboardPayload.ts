import type { Enums } from "@/src/lib/supabase.types";

import type {
  HomeDashboardMissionPreview,
  HomeDashboardOngoingLottery,
  HomeDashboardParticipation,
  HomeDashboardPayload,
  HomeDashboardProfile,
} from "../types/homeDashboard";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseProfile(value: unknown): HomeDashboardProfile {
  if (!isRecord(value)) {
    return { username: null, avatar_url: null };
  }
  return {
    username: typeof value.username === "string" ? value.username : null,
    avatar_url: typeof value.avatar_url === "string" ? value.avatar_url : null,
  };
}

function parseOngoingLottery(
  value: unknown,
): HomeDashboardOngoingLottery | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.title !== "string") {
    return null;
  }
  const ticketCost =
    typeof value.ticket_cost === "number"
      ? value.ticket_cost
      : Number(value.ticket_cost);
  if (!Number.isFinite(ticketCost)) return null;

  const activeCount =
    typeof value.active_tickets_count === "number"
      ? value.active_tickets_count
      : Number(value.active_tickets_count);
  const userCount =
    typeof value.user_active_tickets_count === "number"
      ? value.user_active_tickets_count
      : Number(value.user_active_tickets_count);

  return {
    id: value.id,
    title: value.title,
    image_url: typeof value.image_url === "string" ? value.image_url : null,
    ticket_cost: ticketCost,
    ends_at: typeof value.ends_at === "string" ? value.ends_at : null,
    is_ending_soon: value.is_ending_soon === true,
    active_tickets_count: Number.isFinite(activeCount) ? activeCount : 0,
    user_active_tickets_count: Number.isFinite(userCount) ? userCount : 0,
  };
}

function parseParticipation(value: unknown): HomeDashboardParticipation | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.lottery_id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.draw_at !== "string"
  ) {
    return null;
  }
  const userTickets =
    typeof value.user_ticket_count === "number"
      ? value.user_ticket_count
      : Number(value.user_ticket_count);
  const total =
    typeof value.total_active_tickets === "number"
      ? value.total_active_tickets
      : Number(value.total_active_tickets);
  let winProbability: number | null = null;
  if (value.win_probability === null || value.win_probability === undefined) {
    winProbability = null;
  } else {
    const p =
      typeof value.win_probability === "number"
        ? value.win_probability
        : Number(value.win_probability);
    winProbability = Number.isFinite(p) ? p : null;
  }

  return {
    lottery_id: value.lottery_id,
    title: value.title,
    image_url: typeof value.image_url === "string" ? value.image_url : null,
    draw_at: value.draw_at,
    user_ticket_count: Number.isFinite(userTickets) ? userTickets : 0,
    total_active_tickets: Number.isFinite(total) ? total : 0,
    win_probability: winProbability,
  };
}

const MISSION_TYPES: readonly Enums<"mission_type">[] = [
  "survey",
  "video",
  "follow",
  "referral",
  "custom",
  "external_action",
];

function parseMissionPreview(
  value: unknown,
): HomeDashboardMissionPreview | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.title !== "string") {
    return null;
  }
  if (typeof value.mission_type !== "string") return null;
  if (!MISSION_TYPES.includes(value.mission_type as Enums<"mission_type">)) {
    return null;
  }
  const tokenReward =
    typeof value.token_reward === "number"
      ? value.token_reward
      : Number(value.token_reward);
  const maxPerUser =
    typeof value.max_completions_per_user === "number"
      ? value.max_completions_per_user
      : Number(value.max_completions_per_user);
  const used =
    typeof value.user_completions_used === "number"
      ? value.user_completions_used
      : Number(value.user_completions_used);

  return {
    id: value.id,
    title: value.title,
    mission_type: value.mission_type as Enums<"mission_type">,
    token_reward: Number.isFinite(tokenReward) ? tokenReward : 0,
    image_url: typeof value.image_url === "string" ? value.image_url : null,
    max_completions_per_user: Number.isFinite(maxPerUser) ? maxPerUser : 1,
    user_completions_used: Number.isFinite(used) ? used : 0,
  };
}

export function parseHomeDashboardPayload(raw: unknown): HomeDashboardPayload {
  if (!isRecord(raw)) {
    throw new Error("Invalid home dashboard payload");
  }

  const walletRaw = raw.wallet_balance;
  const walletBalance =
    typeof walletRaw === "number"
      ? walletRaw
      : typeof walletRaw === "string"
        ? Number(walletRaw)
        : Number(walletRaw);
  if (!Number.isFinite(walletBalance)) {
    throw new Error("Invalid wallet_balance in home dashboard payload");
  }

  const ongoingRaw = raw.ongoing_lotteries;
  const ongoing: HomeDashboardOngoingLottery[] = Array.isArray(ongoingRaw)
    ? ongoingRaw
        .map(parseOngoingLottery)
        .filter((x): x is HomeDashboardOngoingLottery => x !== null)
    : [];

  const partRaw = raw.participations;
  const participations: HomeDashboardParticipation[] = Array.isArray(partRaw)
    ? partRaw
        .map(parseParticipation)
        .filter((x): x is HomeDashboardParticipation => x !== null)
    : [];

  const missionRaw = raw.mission_previews;
  const mission_previews: HomeDashboardMissionPreview[] = Array.isArray(
    missionRaw,
  )
    ? missionRaw
        .map(parseMissionPreview)
        .filter((x): x is HomeDashboardMissionPreview => x !== null)
    : [];

  return {
    profile: parseProfile(raw.profile),
    wallet_balance: walletBalance,
    ongoing_lotteries: ongoing,
    participations,
    mission_previews,
  };
}
