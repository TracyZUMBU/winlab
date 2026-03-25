export const colors = {
  // Base
  background: "#F9FAFB",
  backgroundDark: "#020617",

  // Brand / accent (never hardcode mockup green in components)
  accent: "rgba(255, 140, 0, 0.9)",
  accentSolid: "#FF8C00",
  accentMuted: "rgba(255, 140, 0, 0.2)",
  onAccent: "#FFFFFF",

  // Text
  text: "#020617",
  textMuted: "#6B7280",

  // Surfaces
  surface: "#FFFFFF",
  surfaceSoft: "#F3F4F6",

  // Borders & lines
  borderSubtle: "rgba(15, 23, 42, 0.06)",

  /** Flat success (icons, sparse use) */
  success: "#16A34A",

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
} as const;
