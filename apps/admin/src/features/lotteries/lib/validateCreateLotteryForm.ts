import {
  LOTTERY_CREATE_STATUSES,
  type CreateAdminLotteryInput,
  type LotteryCreateStatus,
} from "../types/lotteryAdmin";
import { isLotteryCategoryId } from "./lotteryCategories";
import { parisLocalDateTimeToIso } from "./lotteryFormParisTime";

const CREATE_STATUS_SET = new Set<string>(LOTTERY_CREATE_STATUSES);

export type CreateLotteryFormValidationInput = {
  brand_id: string;
  title: string;
  ticket_cost: string;
  number_of_winners: string;
  starts_at_local: string;
  ends_at_local: string;
  draw_at_local: string;
  status: string;
  description?: string;
  short_description?: string;
  category: string;
  image_url?: string;
  is_featured?: boolean;
};

export type CreateLotteryFormValidationResult =
  | { ok: true; payload: CreateAdminLotteryInput }
  | { ok: false; message: string };

function parsePositiveInt(raw: string, label: string): number | { error: string } {
  const trimmed = raw.trim();
  const n = Number(trimmed);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    return { error: label };
  }
  return n;
}

function trimOptional(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  const t = value.trim();
  return t.length > 0 ? t : null;
}

/**
 * Validation bloquante côté client (miroir des règles RPC / contraintes dates).
 */
export function validateCreateLotteryForm(
  input: CreateLotteryFormValidationInput,
): CreateLotteryFormValidationResult {
  if (!input.brand_id.trim()) {
    return { ok: false, message: "Choisissez une marque." };
  }

  const title = input.title.trim();
  if (title.length === 0) {
    return { ok: false, message: "Le titre est obligatoire." };
  }

  const category = input.category.trim();
  if (category.length === 0) {
    return { ok: false, message: "Choisissez une catégorie." };
  }
  if (!isLotteryCategoryId(category)) {
    return { ok: false, message: "Cette catégorie n’est pas autorisée." };
  }

  const ticketCost = parsePositiveInt(
    input.ticket_cost,
    "Le prix d’un ticket doit être au moins 1 jeton.",
  );
  if (typeof ticketCost === "object") {
    return { ok: false, message: ticketCost.error };
  }

  const numberOfWinners = parsePositiveInt(
    input.number_of_winners,
    "Le nombre de gagnants doit être au moins 1.",
  );
  if (typeof numberOfWinners === "object") {
    return { ok: false, message: numberOfWinners.error };
  }

  const statusRaw = input.status.trim();
  if (!CREATE_STATUS_SET.has(statusRaw)) {
    return { ok: false, message: "Ce statut n’est pas autorisé à la création." };
  }
  const status = statusRaw as LotteryCreateStatus;

  const startsIso = parisLocalDateTimeToIso(input.starts_at_local);
  if (!startsIso) {
    return { ok: false, message: "La date d’ouverture est invalide." };
  }

  const endsIso = parisLocalDateTimeToIso(input.ends_at_local);
  if (!endsIso) {
    return { ok: false, message: "La date de fin est invalide." };
  }

  const drawIso = parisLocalDateTimeToIso(input.draw_at_local);
  if (!drawIso) {
    return { ok: false, message: "La date de tirage est invalide." };
  }

  const startsMs = Date.parse(startsIso);
  const endsMs = Date.parse(endsIso);
  const drawMs = Date.parse(drawIso);

  if (startsMs >= endsMs) {
    return {
      ok: false,
      message: "La fin doit être après l’ouverture.",
    };
  }

  if (startsMs >= drawMs) {
    return {
      ok: false,
      message: "Le tirage doit être après l’ouverture.",
    };
  }

  if (endsMs > drawMs) {
    return {
      ok: false,
      message: "Le tirage doit être après la fin des participations.",
    };
  }

  return {
    ok: true,
    payload: {
      brand_id: input.brand_id.trim(),
      title,
      ticket_cost: ticketCost,
      number_of_winners: numberOfWinners,
      starts_at: startsIso,
      ends_at: endsIso,
      draw_at: drawIso,
      status,
      description: trimOptional(input.description),
      short_description: trimOptional(input.short_description),
      category,
      image_url: trimOptional(input.image_url),
      is_featured: Boolean(input.is_featured),
    },
  };
}
