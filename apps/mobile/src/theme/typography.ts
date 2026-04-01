export const typography = {
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "500" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  /** Screen title in app header */
  screenTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  /** Section heading above lists */
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: -0.2,
  },
  /** Card / list item title */
  cardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  /** Secondary line under title */
  cardBody: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  /** Uppercase micro labels (rewards, meta) */
  overline: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 0.6,
  },
} as const;
