import { mixHex } from "./mixHex";

/** Single source for solid accent — `textMutedAccent` is derived from this. */
const ACCENT_SOLID = "#FF8C00";

const TEXT = "#020617";
const TEXT_MUTED = "#6B7280";

/**
 * Secondary copy with a hint of the accent hue (maquette: #61896f from green).
 * Recomputed when `ACCENT_SOLID` changes; do not hardcode a separate tint.
 */
const TEXT_MUTED_ACCENT = mixHex(ACCENT_SOLID, TEXT_MUTED, 0.4);

export const colors = {
  // Base (list/dashboard canvas — maquette #f6f8f6)
  background: "#F6F8F6",
  backgroundDark: "#020617",

  // Brand / accent (never hardcode mockup green in components)
  accent: "rgba(255, 140, 0, 0.9)",
  accentSolid: ACCENT_SOLID,
  accentMuted: "rgba(255, 140, 0, 0.2)",
  /** Full-width info strip (maquette primary/10) */
  accentWash: "rgba(255, 140, 0, 0.1)",
  /** Hairline around accent-tinted surfaces (maquette primary/20) */
  accentBorderMuted: "rgba(255, 140, 0, 0.22)",
  onAccent: "#FFFFFF",

  // Text
  text: TEXT,
  /** Neutral gray (errors, placeholders, non–accent-tinted hints). */
  textMuted: TEXT_MUTED,
  /** Body / subtitle / inactive UI: gray slightly pulled toward `accentSolid`. */
  textMutedAccent: TEXT_MUTED_ACCENT,

  // Surfaces
  surface: "#FFFFFF",
  surfaceSoft: "#F3F4F6",

  // Borders & lines
  borderSubtle: "rgba(15, 23, 42, 0.06)",

  /** Flat success (icons, sparse use) */
  success: "#16A34A",

  /** Error / destructive (text, chips, alerts) */
  dangerSolid: "#DC2626",
  dangerMuted: "rgba(220, 38, 38, 0.15)",

  /**
   * Muted surface tints for status / info chips (semantic, not domain-specific names).
   */
  semantic: {
    successMuted: "rgba(22, 163, 74, 0.15)",
    warningMuted: "rgba(245, 158, 11, 0.15)",
    neutralMuted: "rgba(107, 114, 128, 0.15)",
  },

  /** Neutral shadow (not tied to accent). */
  shadow: "rgba(0, 0, 0, 0.08)",

  /** Scrim on media thumbnails (e.g. video play overlay). */
  overlayScrim: "rgba(0, 0, 0, 0.2)",
} as const;
