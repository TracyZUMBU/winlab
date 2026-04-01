import { colors } from "./colors";
import { layout } from "./layout";
import { spacing } from "./spacing";
import { typography } from "./typography";
import { radius } from "./radius";

export const theme = {
  colors,
  layout,
  spacing,
  typography,
  radius,
} as const;

export type Theme = typeof theme;

