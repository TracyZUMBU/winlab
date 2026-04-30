import type { Enums } from "@/src/lib/supabase.types";

/**
 * Curated Unsplash thumbnails (soft greens / neutrals aligned with app canvas #F6F8F6).
 * Hotlinking via images.unsplash.com is allowed; same mission id always maps to the same image.
 */
const UNSPLASH = "auto=format&fit=crop&w=200&h=200&q=80";

const SURVEY = [
  `https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?${UNSPLASH}`,
  `https://images.unsplash.com/photo-1497215728101-856f1ea35b47?${UNSPLASH}`,
  `https://images.unsplash.com/photo-1499951367842-4a320d8d0fa8?${UNSPLASH}`,
] as const;

const VIDEO = [
  `https://images.unsplash.com/photo-1492691527719-9e1a00743cc9?${UNSPLASH}`,
  `https://images.unsplash.com/photo-1524712245324-2c4e7d0b9700?${UNSPLASH}`,
  `https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?${UNSPLASH}`,
] as const;

const FOLLOW = [
  `https://images.unsplash.com/photo-1523240795612-9a054b055db4?${UNSPLASH}`,
  `https://images.unsplash.com/photo-1552664730-d307ca884978?${UNSPLASH}`,
  `https://images.unsplash.com/photo-1557804506-669a67965ba0?${UNSPLASH}`,
] as const;

const REFERRAL = [
  `https://images.unsplash.com/photo-1460925895917-afdab827c52f?${UNSPLASH}`,
  `https://images.unsplash.com/photo-1551288049-bebda4e38f71?${UNSPLASH}`,
  `https://images.unsplash.com/photo-1513885535751-8b9238bd345a?${UNSPLASH}`,
] as const;

const CUSTOM = [
  `https://images.unsplash.com/photo-1557683316-973673baf926?${UNSPLASH}`,
  `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?${UNSPLASH}`,
  `https://images.unsplash.com/photo-1557682250-33a709fee222?${UNSPLASH}`,
] as const;

/** Daily check-in: calm desk / routine imagery aligned with app canvas. */
const DAILY_LOGIN = [
  `https://images.unsplash.com/photo-1506784984367-0b86606f8e21?${UNSPLASH}`,
  `https://images.unsplash.com/photo-1434030216411-0b793f4b4173?${UNSPLASH}`,
  `https://images.unsplash.com/photo-1517694712202-3dd8430e106c?${UNSPLASH}`,
] as const;

const POOLS: Record<Enums<"mission_type">, readonly string[]> = {
  survey: SURVEY,
  video: VIDEO,
  follow: FOLLOW,
  referral: REFERRAL,
  custom: CUSTOM,
  daily_login: DAILY_LOGIN,
};

function hashMissionId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getMissionThumbnailFallbackUri(
  missionId: string,
  missionType: Enums<"mission_type">,
): string {
  const pool = POOLS[missionType];
  const idx = hashMissionId(missionId) % pool.length;
  return pool[idx]!;
}
