import type {
  LotteryStatus,
  MissionStatus,
  MissionType,
  MissionValidationMode,
  ReferralStatus,
  WalletReferenceType,
  WalletTransactionType,
} from "@/src/lib/supabase/database.enums";
import {
  WalletReferenceTypeValues,
  WalletTransactionTypeValues,
} from "@/src/lib/supabase/database.enums";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

/** Matrice personas documentée : ./seed-staging-v1-personas.md */

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type SeedUserKey =
  | "new_user"
  | "active_user"
  | "power_user"
  | "winner_user"
  | "referrer_user"
  | "referred_user";

type SeedUserConfig = {
  key: SeedUserKey;
  email: string;
  password: string;
  username: string;
};

/** Après upsert profil : id + email + referral_code généré par la DB */
type SeedUserProfile = {
  id: string;
  email: string;
  referral_code: string;
};

type BrandSeed = {
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
};

type MissionSeed = {
  key: string;
  brandSlug: string;
  title: string;
  description: string;
  mission_type: MissionType;
  token_reward: number;
  status: MissionStatus;
  starts_at: string | null;
  ends_at: string | null;
  max_completions_total: number | null;
  max_completions_per_user: number;
  validation_mode: MissionValidationMode;
  metadata: Record<string, unknown>;
};

type LotterySeed = {
  key: string;
  brandSlug: string;
  title: string;
  slug: string;
  description: string;
  category: string | null;
  image_url: string | null;
  ticket_cost: number;
  number_of_winners: number;
  status: LotteryStatus;
  starts_at: string | null;
  ends_at: string | null;
  draw_at: string | null;
};

type WalletDirection = "credit" | "debit";

type WalletTransactionSeed = {
  key: string;
  userKey: SeedUserKey;
  amount: number;
  direction: WalletDirection;
  transaction_type: WalletTransactionType;
  reference_type: WalletReferenceType | null;
  reference_key: string | null;
  description: string | null;
  created_at: string;
};

type MissionCompletionSeed = {
  key: string;
  missionKey: string;
  userKey: SeedUserKey;
  status: "pending" | "approved" | "rejected";
  completed_at: string | null;
  reviewed_at: string | null;
  reward_transaction_key: string | null;
  proof_data: Record<string, unknown>;
};

type TicketSeed = {
  key: string;
  lotteryKey: string;
  userKey: SeedUserKey;
  wallet_transaction_key: string | null;
  status: "active";
  purchased_at: string;
};

type WinnerSeed = {
  lotteryKey: string;
  ticketKey: string;
  userKey: SeedUserKey;
  position: number;
};

type ReferralSeed = {
  referrerUserKey: SeedUserKey;
  referredUserKey: SeedUserKey;
  status: ReferralStatus;
  qualified_at: string | null;
  reward_transaction_key: string | null;
};

const users: SeedUserConfig[] = [
  {
    key: "new_user",
    email: "seed.new.user@booknglow.app",
    password: "SeedUser123!",
    username: "seed_new_user",
  },
  {
    key: "active_user",
    email: "seed.active.user@booknglow.app",
    password: "SeedUser123!",
    username: "seed_active_user",
  },
  {
    key: "power_user",
    email: "seed.power.user@booknglow.app",
    password: "SeedUser123!",
    username: "seed_power_user",
  },
  {
    key: "winner_user",
    email: "seed.winner.user@booknglow.app",
    password: "SeedUser123!",
    username: "seed_winner_user",
  },
  {
    key: "referrer_user",
    email: "seed.referrer.user@booknglow.app",
    password: "SeedUser123!",
    username: "seed_referrer_user",
  },
  {
    key: "referred_user",
    email: "seed.referred.user@booknglow.app",
    password: "SeedUser123!",
    username: "seed_referred_user",
  },
];

const brands: BrandSeed[] = [
  {
    name: "Seed Glam Studio",
    slug: "seed-glam-studio",
    logo_url: null,
    website_url: "https://example.com/seed-glam-studio",
    is_active: true,
  },
  {
    name: "Seed Skin Lab",
    slug: "seed-skin-lab",
    logo_url: null,
    website_url: "https://example.com/seed-skin-lab",
    is_active: true,
  },
  {
    name: "Seed Nail House",
    slug: "seed-nail-house",
    logo_url: null,
    website_url: null,
    is_active: true,
  },
  {
    name: "Seed Beauty Club Paris",
    slug: "seed-beauty-club-paris",
    logo_url: null,
    website_url: "https://example.com/seed-beauty-club-paris",
    is_active: true,
  },
  {
    name: "Seed Old Brand",
    slug: "seed-old-brand",
    logo_url: null,
    website_url: null,
    is_active: false,
  },
];

// TODO: remplace mission_type par de vraies valeurs de ton enum Postgres.
const missions: MissionSeed[] = [
  {
    key: "m1",
    brandSlug: "seed-glam-studio",
    title: "Poster une story après votre visite",
    description: "Publier une story Instagram en mentionnant la marque.",
    mission_type: "survey",
    token_reward: 30,
    status: "active",
    starts_at: "2026-03-10T09:00:00Z",
    ends_at: "2026-03-28T23:59:59Z",
    max_completions_total: null,
    max_completions_per_user: 1,
    validation_mode: "automatic",
    metadata: { network: "instagram" },
  },
  {
    key: "m2",
    brandSlug: "seed-skin-lab",
    title: "Publier un avis après prestation",
    description: "Poster un avis détaillé avec photo.",
    mission_type: "survey",
    token_reward: 45,
    status: "active",
    starts_at: "2026-03-08T09:00:00Z",
    ends_at: "2026-03-30T23:59:59Z",
    max_completions_total: null,
    max_completions_per_user: 1,
    validation_mode: "manual",
    metadata: { requires_photo: true },
  },
  {
    key: "m3",
    brandSlug: "seed-nail-house",
    title: "Partager votre résultat en post",
    description: "Publier un post avec le résultat final.",
    mission_type: "custom",
    token_reward: 50,
    status: "active",
    starts_at: "2026-03-01T09:00:00Z",
    ends_at: null,
    max_completions_total: null,
    max_completions_per_user: 1,
    validation_mode: "manual",
    metadata: { network: "instagram" },
  },
  {
    key: "m4",
    brandSlug: "seed-beauty-club-paris",
    title: "Taguer la marque dans une vidéo",
    description: "Publier une courte vidéo et mentionner la marque.",
    mission_type: "video",
    token_reward: 70,
    status: "active",
    starts_at: "2026-03-05T09:00:00Z",
    ends_at: "2026-03-24T23:59:59Z",
    max_completions_total: 10,
    max_completions_per_user: 1,
    validation_mode: "manual",
    metadata: { min_duration_seconds: 10 },
  },
  {
    key: "m5",
    brandSlug: "seed-glam-studio",
    title: "Avis terminé mars",
    description: "Mission déjà terminée.",
    mission_type: "survey",
    token_reward: 35,
    status: "archived",
    starts_at: "2026-02-10T09:00:00Z",
    ends_at: "2026-03-10T23:59:59Z",
    max_completions_total: null,
    max_completions_per_user: 1,
    validation_mode: "manual",
    metadata: {},
  },
  {
    key: "m6",
    brandSlug: "seed-skin-lab",
    title: "Mission ancienne quota 1",
    description: "Mission terminée avec limite par user.",
    mission_type: "survey",
    token_reward: 25,
    status: "archived",
    starts_at: "2026-02-01T09:00:00Z",
    ends_at: "2026-03-01T23:59:59Z",
    max_completions_total: null,
    max_completions_per_user: 1,
    validation_mode: "manual",
    metadata: {},
  },
  {
    key: "m7",
    brandSlug: "seed-glam-studio",
    title: "Mission brouillon",
    description: "Non visible côté utilisateur.",
    mission_type: "survey",
    token_reward: 20,
    status: "draft",
    starts_at: null,
    ends_at: null,
    max_completions_total: null,
    max_completions_per_user: 1,
    validation_mode: "manual",
    metadata: {},
  },
  {
    key: "m8",
    brandSlug: "seed-beauty-club-paris",
    title: "Mission à venir",
    description: "Commence bientôt.",
    mission_type: "follow",
    token_reward: 60,
    status: "active",
    starts_at: "2026-03-25T09:00:00Z",
    ends_at: "2026-04-05T23:59:59Z",
    max_completions_total: null,
    max_completions_per_user: 1,
    validation_mode: "manual",
    metadata: {},
  },
  {
    key: "m9",
    brandSlug: "seed-nail-house",
    title: "Mission description longue",
    description:
      "Mission de test avec une description plus longue pour vérifier le rendu visuel dans l’application et le détail mission.",
    mission_type: "custom",
    token_reward: 55,
    status: "active",
    starts_at: "2026-03-12T09:00:00Z",
    ends_at: "2026-04-01T23:59:59Z",
    max_completions_total: null,
    max_completions_per_user: 2,
    validation_mode: "manual",
    metadata: { channel: "instagram", format: "carousel" },
  },
];

const lotteries: LotterySeed[] = [
  {
    key: "l1",
    brandSlug: "seed-glam-studio",
    title: "Loterie active populaire",
    slug: "seed-lottery-active-popular",
    description: "Loterie très populaire en cours.",
    category: "beauty",
    image_url: null,
    ticket_cost: 10,
    number_of_winners: 1,
    status: "active",
    starts_at: "2026-03-01T09:00:00Z",
    ends_at: "2026-03-24T23:59:59Z",
    draw_at: "2026-03-25T12:00:00Z",
  },
  {
    key: "l2",
    brandSlug: "seed-skin-lab",
    title: "Loterie active faible participation",
    slug: "seed-lottery-active-low",
    description: "Peu de tickets pour le moment.",
    category: "skincare",
    image_url: null,
    ticket_cost: 15,
    number_of_winners: 1,
    status: "active",
    starts_at: "2026-03-10T09:00:00Z",
    ends_at: "2026-03-29T23:59:59Z",
    draw_at: "2026-03-30T12:00:00Z",
  },
  {
    key: "l3",
    brandSlug: "seed-beauty-club-paris",
    title: "Loterie premium",
    slug: "seed-lottery-active-premium",
    description: "Récompense premium avec coût plus élevé.",
    category: "premium",
    image_url: null,
    ticket_cost: 25,
    number_of_winners: 1,
    status: "active",
    starts_at: "2026-03-15T09:00:00Z",
    ends_at: "2026-04-05T23:59:59Z",
    draw_at: "2026-04-06T12:00:00Z",
  },
  {
    key: "l4",
    brandSlug: "seed-glam-studio",
    title: "Loterie terminée gagnant unique",
    slug: "seed-lottery-ended-single-winner",
    description: "Une loterie terminée avec un gagnant.",
    category: "beauty",
    image_url: null,
    ticket_cost: 12,
    number_of_winners: 1,
    status: "drawn",
    starts_at: "2026-02-20T09:00:00Z",
    ends_at: "2026-03-08T23:59:59Z",
    draw_at: "2026-03-09T12:00:00Z",
  },
  {
    key: "l5",
    brandSlug: "seed-skin-lab",
    title: "Loterie terminée multi gagnants",
    slug: "seed-lottery-ended-multi-winner",
    description: "Deux gagnants.",
    category: "skincare",
    image_url: null,
    ticket_cost: 18,
    number_of_winners: 2,
    status: "drawn",
    starts_at: "2026-02-25T09:00:00Z",
    ends_at: "2026-03-14T23:59:59Z",
    draw_at: "2026-03-15T12:00:00Z",
  },
  {
    key: "l6",
    brandSlug: "seed-beauty-club-paris",
    title: "Loterie brouillon",
    slug: "seed-lottery-draft",
    description: "Non visible côté utilisateur.",
    category: "draft",
    image_url: null,
    ticket_cost: 20,
    number_of_winners: 1,
    status: "draft",
    starts_at: null,
    ends_at: null,
    draw_at: "2026-04-20T12:00:00Z",
  },
];

const walletTransactions: WalletTransactionSeed[] = [
  {
    key: "wt_new_welcome",
    userKey: "new_user",
    amount: 40,
    direction: "credit",
    transaction_type: "referral_bonus",
    reference_type: "referral",
    reference_key: null,
    description: "Crédit de bienvenue staging",
    created_at: "2026-03-18T10:00:00Z",
  },

  {
    key: "wt_active_m1_reward",
    userKey: "active_user",
    amount: 30,
    direction: "credit",
    transaction_type: "mission_reward",
    reference_type: "mission_completion",
    reference_key: "m1",
    description: "Récompense mission M1",
    created_at: "2026-03-14T09:00:00Z",
  },
  {
    key: "wt_active_m5_reward",
    userKey: "active_user",
    amount: 35,
    direction: "credit",
    transaction_type: "mission_reward",
    reference_type: "mission_completion",
    reference_key: "m5",
    description: "Récompense mission M5",
    created_at: "2026-03-09T09:00:00Z",
  },
  {
    key: "wt_active_ticket_l1_1",
    userKey: "active_user",
    amount: 10,
    direction: "debit",
    transaction_type: "ticket_purchase",
    reference_type: "lottery_ticket",
    reference_key: "l1",
    description: "Achat ticket L1",
    created_at: "2026-03-16T11:00:00Z",
  },
  {
    key: "wt_active_ticket_l1_2",
    userKey: "active_user",
    amount: 10,
    direction: "debit",
    transaction_type: "ticket_purchase",
    reference_type: "lottery_ticket",
    reference_key: "l1",
    description: "Achat ticket L1",
    created_at: "2026-03-17T11:00:00Z",
  },
  {
    key: "wt_active_ticket_l2_1",
    userKey: "active_user",
    amount: 15,
    direction: "debit",
    transaction_type: "ticket_purchase",
    reference_type: "lottery_ticket",
    reference_key: "l2",
    description: "Achat ticket L2",
    created_at: "2026-03-18T11:00:00Z",
  },

  {
    key: "wt_power_m1_reward",
    userKey: "power_user",
    amount: 30,
    direction: "credit",
    transaction_type: "mission_reward",
    reference_type: "mission_completion",
    reference_key: "m1",
    description: "Récompense mission M1",
    created_at: "2026-03-11T08:00:00Z",
  },
  {
    key: "wt_power_m3_reward",
    userKey: "power_user",
    amount: 50,
    direction: "credit",
    transaction_type: "mission_reward",
    reference_type: "mission_completion",
    reference_key: "m3",
    description: "Récompense mission M3",
    created_at: "2026-03-12T08:00:00Z",
  },
  {
    key: "wt_power_m4_reward",
    userKey: "power_user",
    amount: 70,
    direction: "credit",
    transaction_type: "mission_reward",
    reference_type: "mission_completion",
    reference_key: "m4",
    description: "Récompense mission M4",
    created_at: "2026-03-13T08:00:00Z",
  },
  {
    key: "wt_power_m5_reward",
    userKey: "power_user",
    amount: 35,
    direction: "credit",
    transaction_type: "mission_reward",
    reference_type: "mission_completion",
    reference_key: "m5",
    description: "Récompense mission M5",
    created_at: "2026-03-08T08:00:00Z",
  },
  {
    key: "wt_power_m6_reward",
    userKey: "power_user",
    amount: 25,
    direction: "credit",
    transaction_type: "mission_reward",
    reference_type: "mission_completion",
    reference_key: "m6",
    description: "Récompense mission M6",
    created_at: "2026-03-01T08:00:00Z",
  },

  ...Array.from({ length: 5 }).map((_, index) => ({
    key: `wt_power_ticket_l1_${index + 1}`,
    userKey: "power_user" as SeedUserKey,
    amount: 10,
    direction: "debit" as WalletDirection,
    transaction_type: WalletTransactionTypeValues.ticket_purchase,
    reference_type: WalletReferenceTypeValues.lottery_ticket,
    reference_key: "l1",
    description: "Achat ticket L1",
    created_at: `2026-03-${16 + index}T12:00:00Z`,
  })),
  ...Array.from({ length: 3 }).map((_, index) => ({
    key: `wt_power_ticket_l3_${index + 1}`,
    userKey: "power_user" as SeedUserKey,
    amount: 25,
    direction: "debit" as WalletDirection,
    transaction_type: WalletTransactionTypeValues.ticket_purchase,
    reference_type: WalletReferenceTypeValues.lottery_ticket,
    reference_key: "l3",
    description: "Achat ticket L3",
    created_at: `2026-03-${16 + index}T13:00:00Z`,
  })),
  ...Array.from({ length: 2 }).map((_, index) => ({
    key: `wt_power_ticket_l4_${index + 1}`,
    userKey: "power_user" as SeedUserKey,
    amount: 12,
    direction: "debit" as WalletDirection,
    transaction_type: WalletTransactionTypeValues.ticket_purchase,
    reference_type: WalletReferenceTypeValues.lottery_ticket,
    reference_key: "l4",
    description: "Achat ticket L4",
    created_at: `2026-03-07T1${index}:00:00Z`,
  })),

  {
    key: "wt_winner_m2_reward",
    userKey: "winner_user",
    amount: 45,
    direction: "credit",
    transaction_type: "mission_reward",
    reference_type: "mission_completion",
    reference_key: "m2",
    description: "Récompense mission M2",
    created_at: "2026-03-06T09:00:00Z",
  },
  ...Array.from({ length: 3 }).map((_, index) => ({
    key: `wt_winner_ticket_l4_${index + 1}`,
    userKey: "winner_user" as SeedUserKey,
    amount: 12,
    direction: "debit" as WalletDirection,
    transaction_type: WalletTransactionTypeValues.ticket_purchase,
    reference_type: WalletReferenceTypeValues.lottery_ticket,
    reference_key: "l4",
    description: "Achat ticket L4",
    created_at: `2026-03-07T0${index + 8}:00:00Z`,
  })),
  ...Array.from({ length: 2 }).map((_, index) => ({
    key: `wt_winner_ticket_l5_${index + 1}`,
    userKey: "winner_user" as SeedUserKey,
    amount: 18,
    direction: "debit" as WalletDirection,
    transaction_type: WalletTransactionTypeValues.ticket_purchase,
    reference_type: WalletReferenceTypeValues.lottery_ticket,
    reference_key: "l5",
    description: "Achat ticket L5",
    created_at: `2026-03-12T1${index}:00:00Z`,
  })),

  {
    key: "wt_referrer_referral_reward",
    userKey: "referrer_user",
    amount: 50,
    direction: "credit",
    transaction_type: "referral_bonus",
    reference_type: "referral",
    reference_key: "referral_r1",
    description: "Récompense parrainage",
    created_at: "2026-03-19T10:00:00Z",
  },
  {
    key: "wt_referrer_ticket_l2_1",
    userKey: "referrer_user",
    amount: 15,
    direction: "debit",
    transaction_type: "ticket_purchase",
    reference_type: "lottery_ticket",
    reference_key: "l2",
    description: "Achat ticket L2",
    created_at: "2026-03-18T16:00:00Z",
  },
  {
    key: "wt_referrer_ticket_l3_1",
    userKey: "referrer_user",
    amount: 25,
    direction: "debit",
    transaction_type: "ticket_purchase",
    reference_type: "lottery_ticket",
    reference_key: "l3",
    description: "Achat ticket L3",
    created_at: "2026-03-19T16:00:00Z",
  },

  {
    key: "wt_referred_welcome",
    userKey: "referred_user",
    amount: 20,
    direction: "credit",
    transaction_type: "manual_adjustment",
    reference_type: null,
    reference_key: null,
    description: "Bonus nouveau compte",
    created_at: "2026-03-19T09:00:00Z",
  },
  {
    key: "wt_referred_ticket_l2_1",
    userKey: "referred_user",
    amount: 15,
    direction: "debit",
    transaction_type: "ticket_purchase",
    reference_type: "lottery_ticket",
    reference_key: "l2",
    description: "Achat ticket L2",
    created_at: "2026-03-19T17:00:00Z",
  },
];

const missionCompletions: MissionCompletionSeed[] = [
  {
    key: "mc_active_m1",
    missionKey: "m1",
    userKey: "active_user",
    status: "approved",
    completed_at: "2026-03-14T08:50:00Z",
    reviewed_at: "2026-03-14T09:00:00Z",
    reward_transaction_key: "wt_active_m1_reward",
    proof_data: { story_url: "https://example.com/story/1" },
  },
  {
    key: "mc_active_m2",
    missionKey: "m2",
    userKey: "active_user",
    status: "pending",
    completed_at: "2026-03-19T13:00:00Z",
    reviewed_at: null,
    reward_transaction_key: null,
    proof_data: { photo_count: 1 },
  },
  {
    key: "mc_active_m5",
    missionKey: "m5",
    userKey: "active_user",
    status: "approved",
    completed_at: "2026-03-09T08:50:00Z",
    reviewed_at: "2026-03-09T09:00:00Z",
    reward_transaction_key: "wt_active_m5_reward",
    proof_data: { review_length: 220 },
  },

  {
    key: "mc_power_m1",
    missionKey: "m1",
    userKey: "power_user",
    status: "approved",
    completed_at: "2026-03-11T07:50:00Z",
    reviewed_at: "2026-03-11T08:00:00Z",
    reward_transaction_key: "wt_power_m1_reward",
    proof_data: { story_url: "https://example.com/story/2" },
  },
  {
    key: "mc_power_m3",
    missionKey: "m3",
    userKey: "power_user",
    status: "approved",
    completed_at: "2026-03-12T07:50:00Z",
    reviewed_at: "2026-03-12T08:00:00Z",
    reward_transaction_key: "wt_power_m3_reward",
    proof_data: { post_url: "https://example.com/post/3" },
  },
  {
    key: "mc_power_m4",
    missionKey: "m4",
    userKey: "power_user",
    status: "approved",
    completed_at: "2026-03-13T07:50:00Z",
    reviewed_at: "2026-03-13T08:00:00Z",
    reward_transaction_key: "wt_power_m4_reward",
    proof_data: { video_url: "https://example.com/video/4" },
  },
  {
    key: "mc_power_m5",
    missionKey: "m5",
    userKey: "power_user",
    status: "approved",
    completed_at: "2026-03-08T07:50:00Z",
    reviewed_at: "2026-03-08T08:00:00Z",
    reward_transaction_key: "wt_power_m5_reward",
    proof_data: { review_length: 180 },
  },
  {
    key: "mc_power_m6",
    missionKey: "m6",
    userKey: "power_user",
    status: "approved",
    completed_at: "2026-03-01T07:50:00Z",
    reviewed_at: "2026-03-01T08:00:00Z",
    reward_transaction_key: "wt_power_m6_reward",
    proof_data: { review_length: 140 },
  },
  {
    key: "mc_winner_m2",
    missionKey: "m2",
    userKey: "winner_user",
    status: "approved",
    completed_at: "2026-03-06T08:50:00Z",
    reviewed_at: "2026-03-06T09:00:00Z",
    reward_transaction_key: "wt_winner_m2_reward",
    proof_data: { photo_count: 2 },
  },
  {
    key: "mc_referrer_m3",
    missionKey: "m3",
    userKey: "referrer_user",
    status: "pending",
    completed_at: "2026-03-19T14:00:00Z",
    reviewed_at: null,
    reward_transaction_key: null,
    proof_data: { post_url: "https://example.com/post/9" },
  },
];

const tickets: TicketSeed[] = [
  {
    key: "t_active_l1_1",
    lotteryKey: "l1",
    userKey: "active_user",
    wallet_transaction_key: "wt_active_ticket_l1_1",
    status: "active",
    purchased_at: "2026-03-16T11:00:00Z",
  },
  {
    key: "t_active_l1_2",
    lotteryKey: "l1",
    userKey: "active_user",
    wallet_transaction_key: "wt_active_ticket_l1_2",
    status: "active",
    purchased_at: "2026-03-17T11:00:00Z",
  },
  {
    key: "t_active_l2_1",
    lotteryKey: "l2",
    userKey: "active_user",
    wallet_transaction_key: "wt_active_ticket_l2_1",
    status: "active",
    purchased_at: "2026-03-18T11:00:00Z",
  },

  ...Array.from({ length: 5 }).map((_, index) => ({
    key: `t_power_l1_${index + 1}`,
    lotteryKey: "l1",
    userKey: "power_user" as SeedUserKey,
    wallet_transaction_key: `wt_power_ticket_l1_${index + 1}`,
    status: "active" as const,
    purchased_at: `2026-03-${16 + index}T12:00:00Z`,
  })),
  ...Array.from({ length: 3 }).map((_, index) => ({
    key: `t_power_l3_${index + 1}`,
    lotteryKey: "l3",
    userKey: "power_user" as SeedUserKey,
    wallet_transaction_key: `wt_power_ticket_l3_${index + 1}`,
    status: "active" as const,
    purchased_at: `2026-03-${16 + index}T13:00:00Z`,
  })),
  ...Array.from({ length: 2 }).map((_, index) => ({
    key: `t_power_l4_${index + 1}`,
    lotteryKey: "l4",
    userKey: "power_user" as SeedUserKey,
    wallet_transaction_key: `wt_power_ticket_l4_${index + 1}`,
    status: "active" as const,
    purchased_at: `2026-03-07T1${index}:00:00Z`,
  })),

  ...Array.from({ length: 3 }).map((_, index) => ({
    key: `t_winner_l4_${index + 1}`,
    lotteryKey: "l4",
    userKey: "winner_user" as SeedUserKey,
    wallet_transaction_key: `wt_winner_ticket_l4_${index + 1}`,
    status: "active" as const,
    purchased_at: `2026-03-07T0${index + 8}:00:00Z`,
  })),
  ...Array.from({ length: 2 }).map((_, index) => ({
    key: `t_winner_l5_${index + 1}`,
    lotteryKey: "l5",
    userKey: "winner_user" as SeedUserKey,
    wallet_transaction_key: `wt_winner_ticket_l5_${index + 1}`,
    status: "active" as const,
    purchased_at: `2026-03-12T1${index}:00:00Z`,
  })),

  {
    key: "t_referrer_l2_1",
    lotteryKey: "l2",
    userKey: "referrer_user",
    wallet_transaction_key: "wt_referrer_ticket_l2_1",
    status: "active",
    purchased_at: "2026-03-18T16:00:00Z",
  },
  {
    key: "t_referrer_l3_1",
    lotteryKey: "l3",
    userKey: "referrer_user",
    wallet_transaction_key: "wt_referrer_ticket_l3_1",
    status: "active",
    purchased_at: "2026-03-19T16:00:00Z",
  },

  {
    key: "t_referred_l2_1",
    lotteryKey: "l2",
    userKey: "referred_user",
    wallet_transaction_key: "wt_referred_ticket_l2_1",
    status: "active",
    purchased_at: "2026-03-19T17:00:00Z",
  },
];

const winners: WinnerSeed[] = [
  {
    lotteryKey: "l4",
    ticketKey: "t_winner_l4_2",
    userKey: "winner_user",
    position: 1,
  },
  {
    lotteryKey: "l5",
    ticketKey: "t_power_l4_1", // remplacé plus bas si tu préfères lier des tickets L5 uniquement
    userKey: "power_user",
    position: 1,
  },
  {
    lotteryKey: "l5",
    ticketKey: "t_winner_l5_1",
    userKey: "winner_user",
    position: 2,
  },
];

const referrals: ReferralSeed[] = [
  {
    referrerUserKey: "referrer_user",
    referredUserKey: "referred_user",
    status: "qualified",
    qualified_at: "2026-03-19T10:00:00Z",
    reward_transaction_key: "wt_referrer_referral_reward",
  },
];

async function getAllAuthUsers() {
  const perPage = 100;
  let page = 1;
  const allUsers: Array<{ id: string; email?: string | null }> = [];

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    allUsers.push(...data.users);

    if (data.users.length < perPage) break;
    page += 1;
  }

  return allUsers;
}

async function ensureAuthUsers() {
  const existingUsers = await getAllAuthUsers();
  const emailToId = new Map<string, string>();

  for (const seedUser of users) {
    const existing = existingUsers.find(
      (user) => user.email?.toLowerCase() === seedUser.email.toLowerCase(),
    );

    if (existing) {
      emailToId.set(seedUser.email, existing.id);
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: seedUser.email,
      password: seedUser.password,
      email_confirm: true,
      user_metadata: {
        username: seedUser.username,
        seed_key: seedUser.key,
      },
    });

    if (error) throw error;
    if (!data.user)
      throw new Error(`Auth user not returned for ${seedUser.email}`);

    emailToId.set(seedUser.email, data.user.id);
  }

  return emailToId;
}

async function upsertProfiles(emailToId: Map<string, string>) {
  const rows = users.map((user) => ({
    id: emailToId.get(user.email)!,
    email: user.email,
    username: user.username,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("profiles")
    .upsert(rows, { onConflict: "email" });
  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from("profiles")
    .select("id,email,username,referral_code")
    .in(
      "email",
      users.map((u) => u.email),
    );

  if (fetchError) throw fetchError;

  const map = new Map<SeedUserKey, SeedUserProfile>();
  for (const seedUser of users) {
    const found = data.find((row) => row.email === seedUser.email);
    if (!found) throw new Error(`Profile not found for ${seedUser.email}`);
    if (!found.referral_code)
      throw new Error(`Profile missing referral_code for ${seedUser.email}`);
    map.set(seedUser.key, {
      id: found.id,
      email: found.email,
      referral_code: found.referral_code,
    });
  }

  return map;
}

async function upsertBrands() {
  const { error } = await supabase
    .from("brands")
    .upsert(brands, { onConflict: "slug" });
  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from("brands")
    .select("id,slug")
    .in(
      "slug",
      brands.map((brand) => brand.slug),
    );

  if (fetchError) throw fetchError;

  const map = new Map<string, string>();
  for (const row of data) map.set(row.slug, row.id);
  return map;
}

async function upsertMissions(brandIdBySlug: Map<string, string>) {
  const rows = missions.map((mission) => ({
    brand_id: brandIdBySlug.get(mission.brandSlug)!,
    title: mission.title,
    description: mission.description,
    mission_type: mission.mission_type,
    token_reward: mission.token_reward,
    status: mission.status,
    starts_at: mission.starts_at,
    ends_at: mission.ends_at,
    max_completions_total: mission.max_completions_total,
    max_completions_per_user: mission.max_completions_per_user,
    metadata: { ...mission.metadata, seed_key: mission.key },
    validation_mode: mission.validation_mode,
  }));

  // Pas de slug sur missions dans ton schéma, donc on nettoie puis on recrée via seed_key en metadata.
  const { data: existing, error: existingError } = await supabase
    .from("missions")
    .select("id,metadata")
    .not("metadata->>seed_key", "is", null);

  if (existingError) throw existingError;

  const idsToDelete = existing
    .filter(
      (row) =>
        row.metadata?.seed_key &&
        missions.some((m) => m.key === row.metadata.seed_key),
    )
    .map((row) => row.id);

  if (idsToDelete.length > 0) {
    const { error: deleteCompletionsError } = await supabase
      .from("mission_completions")
      .delete()
      .in("mission_id", idsToDelete);
    if (deleteCompletionsError) throw deleteCompletionsError;

    const { error: deleteMissionsError } = await supabase
      .from("missions")
      .delete()
      .in("id", idsToDelete);
    if (deleteMissionsError) throw deleteMissionsError;
  }

  const { data, error } = await supabase
    .from("missions")
    .insert(rows)
    .select("id,metadata");
  if (error) throw error;

  const map = new Map<string, string>();
  for (const row of data) {
    if (row.metadata?.seed_key) map.set(row.metadata.seed_key, row.id);
  }

  return map;
}

async function upsertLotteries(brandIdBySlug: Map<string, string>) {
  const rows = lotteries.map((lottery) => ({
    brand_id: brandIdBySlug.get(lottery.brandSlug)!,
    title: lottery.title,
    slug: lottery.slug,
    description: lottery.description,
    category: lottery.category,
    image_url: lottery.image_url,
    ticket_cost: lottery.ticket_cost,
    number_of_winners: lottery.number_of_winners,
    status: lottery.status,
    starts_at: lottery.starts_at,
    ends_at: lottery.ends_at,
    draw_at: lottery.draw_at,
  }));

  const { error } = await supabase
    .from("lotteries")
    .upsert(rows, { onConflict: "slug" });
  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from("lotteries")
    .select("id,slug")
    .in(
      "slug",
      lotteries.map((lottery) => lottery.slug),
    );

  if (fetchError) throw fetchError;

  const map = new Map<string, string>();
  for (const lottery of lotteries) {
    const found = data.find((row) => row.slug === lottery.slug);
    if (!found) throw new Error(`Lottery not found for slug ${lottery.slug}`);
    map.set(lottery.key, found.id);
  }

  return map;
}

async function cleanupSeedData() {
  const seedEmails = users.map((user) => user.email);
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id,email")
    .in("email", seedEmails);

  if (profilesError) throw profilesError;

  const userIds = profilesData.map((row) => row.id);

  if (userIds.length > 0) {
    await supabase.from("lottery_winners").delete().in("user_id", userIds);
    await supabase.from("lottery_tickets").delete().in("user_id", userIds);
    await supabase.from("mission_completions").delete().in("user_id", userIds);
    await supabase
      .from("referrals")
      .delete()
      .or(
        `referrer_user_id.in.(${userIds.join(",")}),referred_user_id.in.(${userIds.join(",")})`,
      );
    await supabase.from("wallet_transactions").delete().in("user_id", userIds);
  }

  const seedLotterySlugs = lotteries.map((l) => l.slug);
  const { data: seedLotteries } = await supabase
    .from("lotteries")
    .select("id,slug")
    .in("slug", seedLotterySlugs);

  const lotteryIds = seedLotteries?.map((row) => row.id) ?? [];

  if (lotteryIds.length > 0) {
    await supabase
      .from("lottery_winners")
      .delete()
      .in("lottery_id", lotteryIds);
    await supabase
      .from("lottery_tickets")
      .delete()
      .in("lottery_id", lotteryIds);
  }
}

async function insertWalletTransactions(
  userIdByKey: Map<SeedUserKey, SeedUserProfile>,
  missionIdByKey: Map<string, string>,
  lotteryIdByKey: Map<string, string>,
) {
  const referralPlaceholderId = crypto.randomUUID();
  const rows = walletTransactions.map((tx) => {
    let referenceId: string | null = null;

    if (tx.reference_type === "mission_completion" && tx.reference_key) {
      referenceId = missionIdByKey.get(tx.reference_key) ?? null;
    } else if (tx.reference_type === "lottery_ticket" && tx.reference_key) {
      referenceId = lotteryIdByKey.get(tx.reference_key) ?? null;
    } else if (tx.reference_type === "referral" && tx.reference_key) {
      referenceId = referralPlaceholderId;
    }

    return {
      user_id: userIdByKey.get(tx.userKey)!.id,
      amount: tx.amount,
      direction: tx.direction,
      transaction_type: tx.transaction_type,
      reference_type: tx.reference_type,
      reference_id: referenceId,
      description: tx.description,
      created_at: tx.created_at,
    };
  });

  const { data, error } = await supabase
    .from("wallet_transactions")
    .insert(rows)
    .select("id,created_at,description");

  if (error) throw error;

  const map = new Map<string, string>();
  for (let i = 0; i < walletTransactions.length; i += 1) {
    map.set(walletTransactions[i].key, data[i].id);
  }

  return map;
}

function missionCompletionCreatedAt(completion: MissionCompletionSeed): string {
  return (
    completion.completed_at ??
    completion.reviewed_at ??
    "2026-01-01T00:00:00Z"
  );
}

function missionCompletionUpdatedAt(completion: MissionCompletionSeed): string {
  const created = missionCompletionCreatedAt(completion);
  return completion.reviewed_at ?? completion.completed_at ?? created;
}

async function insertMissionCompletions(
  userIdByKey: Map<SeedUserKey, SeedUserProfile>,
  missionIdByKey: Map<string, string>,
  walletIdByKey: Map<string, string>,
) {
  const rows = missionCompletions.map((completion) => ({
    mission_id: missionIdByKey.get(completion.missionKey)!,
    user_id: userIdByKey.get(completion.userKey)!.id,
    status: completion.status,
    completed_at: completion.completed_at,
    reviewed_at: completion.reviewed_at,
    reward_transaction_id: completion.reward_transaction_key
      ? (walletIdByKey.get(completion.reward_transaction_key) ?? null)
      : null,
    proof_data: { ...completion.proof_data, seed_key: completion.key },
    created_at: missionCompletionCreatedAt(completion),
    updated_at: missionCompletionUpdatedAt(completion),
  }));

  const { error } = await supabase.from("mission_completions").insert(rows);
  if (error) throw error;
}

async function insertTickets(
  userIdByKey: Map<SeedUserKey, SeedUserProfile>,
  lotteryIdByKey: Map<string, string>,
  walletIdByKey: Map<string, string>,
) {
  const rows = tickets.map((ticket) => ({
    lottery_id: lotteryIdByKey.get(ticket.lotteryKey)!,
    user_id: userIdByKey.get(ticket.userKey)!.id,
    wallet_transaction_id: ticket.wallet_transaction_key
      ? (walletIdByKey.get(ticket.wallet_transaction_key) ?? null)
      : null,
    status: ticket.status,
    purchased_at: ticket.purchased_at,
  }));

  const { data, error } = await supabase
    .from("lottery_tickets")
    .insert(rows)
    .select("id,purchased_at");

  if (error) throw error;

  const map = new Map<string, string>();
  for (let i = 0; i < tickets.length; i += 1) {
    map.set(tickets[i].key, data[i].id);
  }

  return map;
}

async function insertWinners(
  userIdByKey: Map<SeedUserKey, SeedUserProfile>,
  lotteryIdByKey: Map<string, string>,
  ticketIdByKey: Map<string, string>,
) {
  const correctedWinners = winners.map((winner) => {
    if (winner.lotteryKey === "l5" && winner.ticketKey === "t_power_l4_1") {
      return {
        ...winner,
        ticketKey: "t_winner_l5_2",
        userKey: "winner_user" as SeedUserKey,
      };
    }
    return winner;
  });

  const rows = correctedWinners.map((winner) => ({
    lottery_id: lotteryIdByKey.get(winner.lotteryKey)!,
    ticket_id: ticketIdByKey.get(winner.ticketKey)!,
    user_id: userIdByKey.get(winner.userKey)!.id,
    position: winner.position,
  }));

  const { error } = await supabase.from("lottery_winners").insert(rows);
  if (error) throw error;
}

async function insertReferrals(
  userIdByKey: Map<SeedUserKey, SeedUserProfile>,
  walletIdByKey: Map<string, string>,
) {
  const rows = referrals.map((referral) => ({
    referrer_user_id: userIdByKey.get(referral.referrerUserKey)!.id,
    referred_user_id: userIdByKey.get(referral.referredUserKey)!.id,
    referral_code: userIdByKey.get(referral.referrerUserKey)!.referral_code,
    status: referral.status,
    qualified_at: referral.qualified_at,
    reward_transaction_id: referral.reward_transaction_key
      ? (walletIdByKey.get(referral.reward_transaction_key) ?? null)
      : null,
  }));

  const { error } = await supabase.from("referrals").insert(rows);
  if (error) throw error;
}

async function main() {
  console.log("1. ensure auth users");
  const emailToId = await ensureAuthUsers();

  console.log("2. upsert profiles");
  const userIdByKey = await upsertProfiles(emailToId);

  console.log("3. cleanup previous seed data");
  await cleanupSeedData();

  console.log("4. upsert brands");
  const brandIdBySlug = await upsertBrands();

  console.log("5. upsert missions");
  const missionIdByKey = await upsertMissions(brandIdBySlug);

  console.log("6. upsert lotteries");
  const lotteryIdByKey = await upsertLotteries(brandIdBySlug);

  console.log("7. insert wallet transactions");
  const walletIdByKey = await insertWalletTransactions(
    userIdByKey,
    missionIdByKey,
    lotteryIdByKey,
  );

  console.log("8. insert mission completions");
  await insertMissionCompletions(userIdByKey, missionIdByKey, walletIdByKey);

  console.log("9. insert tickets");
  const ticketIdByKey = await insertTickets(
    userIdByKey,
    lotteryIdByKey,
    walletIdByKey,
  );

  console.log("10. insert winners");
  await insertWinners(userIdByKey, lotteryIdByKey, ticketIdByKey);

  console.log("11. insert referrals");
  await insertReferrals(userIdByKey, walletIdByKey);

  console.log("✅ staging seed v1 completed");
}

main().catch((error) => {
  console.error("❌ staging seed v1 failed");
  console.error(error);
  process.exit(1);
});
