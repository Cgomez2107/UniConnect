/**
 * Design Tokens - Spacing
 *
 * CRÍTICO: Sistema de espaciado consistente para Web (Tailwind) y Mobile (React Native)
 * Base: 4px unit
 * Naming: t-shirt sizes + numeric (xs, sm, md, lg, xl, 2xl, etc.)
 */

/** Base spacing unit: 4px */
export const SPACING_UNIT = 4;

export const spacing = {
  // T-shirt sizes (Web: Tailwind-compatible)
  xs: "4px",    // 1 unit
  sm: "8px",    // 2 units
  md: "12px",   // 3 units
  lg: "16px",   // 4 units
  xl: "24px",   // 6 units
  "2xl": "32px", // 8 units
  "3xl": "40px", // 10 units
  "4xl": "48px", // 12 units
  "5xl": "56px", // 14 units
  "6xl": "64px", // 16 units

  // Common aliases
  none: "0px",
  full: "100%",
  auto: "auto",
} as const;

/** Numeric spacing values (for RN: use without "px") */
export const spacingNumeric = {
  0: 0,
  1: 4,     // xs
  2: 8,     // sm
  3: 12,    // md
  4: 16,    // lg
  6: 24,    // xl
  8: 32,    // 2xl
  10: 40,   // 3xl
  12: 48,   // 4xl
  14: 56,   // 5xl
  16: 64,   // 6xl
} as const;

/** Padding scale (standard padding values) */
export const padding = {
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
  "2xl": spacing["2xl"],
} as const;

/** Margin scale (standard margin values) */
export const margin = {
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
  "2xl": spacing["2xl"],
  auto: spacing.auto,
} as const;

/** Gap scale (grid/flex gap) */
export const gap = {
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
  "2xl": spacing["2xl"],
} as const;

/** Border radius scale */
export const borderRadius = {
  none: "0px",
  sm: "2px",
  md: "4px",
  lg: "8px",
  xl: "12px",
  "2xl": "16px",
  "3xl": "24px",
  full: "9999px",
} as const;

/** Shadow scale (Web-specific, but structured for reference) */
export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
} as const;

export type Spacing = typeof spacing;
export type SpacingNumeric = typeof spacingNumeric;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
