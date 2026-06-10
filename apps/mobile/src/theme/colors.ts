import { mixHex } from "./mixHex";

/** Single source for solid accent — `textMutedAccent` is derived from this. */
const ACCENT_SOLID = "#3B82F6";

const TEXT = "#020617";
const TEXT_MUTED = "#6B7280";

/**
 * Secondary copy with a hint of the accent hue (mixed from accent toward muted gray).
 * Recomputed when `ACCENT_SOLID` changes; do not hardcode a separate tint.
 */
const TEXT_MUTED_ACCENT = mixHex(ACCENT_SOLID, TEXT_MUTED, 0.4);

/** Muted danger tint (icon/chip backgrounds). Shared by top-level and `semantic`. */
const DANGER_MUTED = "rgba(220, 38, 38, 0.15)";

export const colors = {
  // Base — cool neutral canvas (harmonized with blue primary)
  background: "#F4F7FC",
  backgroundDark: "#020617",

  backgroundHeader: "#FFFFFF",

  // Brand / accent (#3B82F6, blue-500)
  accent: "rgba(59, 130, 246, 0.9)",
  accentSolid: ACCENT_SOLID,
  accentMuted: "rgba(59, 130, 246, 0.2)",
  /** Full-width info strip (primary ~10%) */
  accentWash: "rgba(59, 130, 246, 0.1)",
  /** Hairline around accent-tinted surfaces (primary ~20%) */
  accentBorderMuted: "rgba(59, 130, 246, 0.22)",
  /** Selected rows / chips (replaces former orange-50 surfaces). */
  accentSurfaceTint: "#EFF6FF",
  onAccent: "#FFFFFF",

  // Text
  text: TEXT,
  /** gray body/ subtitle / inactive UI: gray slightly pulled toward `accentSolid`. */
  textGrayLight: "#9CA3AF",
  /** Neutral gray (errors, placeholders, non–accent-tinted hints). */
  textMuted: TEXT_MUTED,
  /** Body / subtitle / inactive UI: gray slightly pulled toward `accentSolid`. */
  textMutedAccent: TEXT_MUTED_ACCENT,

  // Surfaces
  surface: "#FFFFFF",
  surfaceSoft: "#F1F5F9",

  // Borders & lines
  borderSubtle: "rgba(15, 23, 42, 0.06)",
  /** Marketplace / card frames (maquette). */
  borderCard: "rgba(15, 23, 42, 0.12)",
  borderAccentMuted: "rgba(59, 130, 246, 0.2)",

  /** Flat success (icons, sparse use) */
  success: "#16A34A",

  /** Error / destructive (text, chips, alerts) */
  dangerSolid: "#DC2626",
  dangerMuted: DANGER_MUTED,

  /**
   * Muted surface tints for status / info chips (semantic, not domain-specific names).
   */
  semantic: {
    successMuted: "rgba(22, 163, 74, 0.15)",
    warningMuted: "rgba(245, 158, 11, 0.15)",
    neutralMuted: "rgba(107, 114, 128, 0.15)",
    dangerMuted: DANGER_MUTED,
  },

  /** Neutral shadow (not tied to accent). */
  shadow: "rgba(0, 0, 0, 0.08)",

  /** Scrim on media thumbnails (e.g. video play overlay). */
  overlayScrim: "rgba(0, 0, 0, 0.2)",

  /**
   * Home screen accents — breaks up all-blue surfaces (experiment on accueil only).
   */
  home: {
    tokenIcon: "#FFCE3A",
    lotteryParticipate: "#FA6CB8",
  },
} as const;
