/**
 * Design Tokens - Typography
 *
 * CRÍTICO: Sistema tipográfico consistente para Web (Tailwind) y Mobile (React Native)
 * Base font: Inter (Web), System (Mobile)
 * Naming: size + weight combinations
 */

/** Font sizes (px) */
export const fontSize = {
  xs: "12px",      // Small labels, captions
  sm: "14px",      // Small text, hints
  md: "16px",      // Body text (default)
  lg: "18px",      // Subtitle, lead text
  xl: "20px",      // Section headings
  "2xl": "24px",   // Page headings
  "3xl": "30px",   // Major headings
  "4xl": "36px",   // Hero headings
  "5xl": "48px",   // Extra large headings
} as const;

/** Font sizes numeric (px, for React Native) */
export const fontSizeNumeric = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
} as const;

/** Font weights */
export const fontWeight = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

/** Line heights (unitless multiplier for RN, px for Web) */
export const lineHeight = {
  tight: 1.2,    // Headings
  normal: 1.5,   // Body
  relaxed: 1.75, // Loose text
  loose: 2,      // Extra loose
} as const;

/** Letter spacing (tracking) */
export const letterSpacing = {
  tighter: "-0.05em",
  tight: "-0.025em",
  normal: "0em",
  wide: "0.025em",
  wider: "0.05em",
  widest: "0.1em",
} as const;

/** Predefined typography styles (for convenience) */
export const typographyStyles = {
  // Headings
  h1: {
    fontSize: fontSize["4xl"],
    fontSizeNumeric: fontSizeNumeric["4xl"],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
  },
  h2: {
    fontSize: fontSize["3xl"],
    fontSizeNumeric: fontSizeNumeric["3xl"],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
  },
  h3: {
    fontSize: fontSize["2xl"],
    fontSizeNumeric: fontSizeNumeric["2xl"],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
  },
  h4: {
    fontSize: fontSize.xl,
    fontSizeNumeric: fontSizeNumeric.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
  },
  h5: {
    fontSize: fontSize.lg,
    fontSizeNumeric: fontSizeNumeric.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
  },
  h6: {
    fontSize: fontSize.md,
    fontSizeNumeric: fontSizeNumeric.md,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
  },

  // Body text
  bodyLarge: {
    fontSize: fontSize.md,
    fontSizeNumeric: fontSizeNumeric.md,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.relaxed,
  },
  bodyMedium: {
    fontSize: fontSize.sm,
    fontSizeNumeric: fontSizeNumeric.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },
  bodySmall: {
    fontSize: fontSize.xs,
    fontSizeNumeric: fontSizeNumeric.xs,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },

  // Label/Caption
  label: {
    fontSize: fontSize.sm,
    fontSizeNumeric: fontSizeNumeric.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
  },
  caption: {
    fontSize: fontSize.xs,
    fontSizeNumeric: fontSizeNumeric.xs,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.tight,
  },

  // Button text (standard)
  button: {
    fontSize: fontSize.md,
    fontSizeNumeric: fontSizeNumeric.md,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
  },
} as const;

/** Font family (descriptive, actual fonts managed in app) */
export const fontFamily = {
  sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'Fira Code', 'Courier New', monospace",
  serif: "Georgia, serif",
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

export type FontSize = typeof fontSize;
export type FontWeight = typeof fontWeight;
export type LineHeight = typeof lineHeight;
export type TypographyStyle = typeof typographyStyles;
export type FontFamily = typeof fontFamily;
