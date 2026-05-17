/**
 * UC Brand Colors
 * Central color palette for UniConnect
 */

export const UC_COLORS = {
  // Primary
  blue: "#0d2852", // UC Blue
  blueLight: "#f0f4ff",
  blueDark: "#051d3d",

  // Secondary
  gold: "#c8ae7a", // UC Gold
  goldLight: "#f5f1e8",
  goldDark: "#9e8960",

  // Semantic
  success: "#10b981",
  successLight: "#ecfdf5",
  warning: "#f59e0b",
  warningLight: "#fffbeb",
  error: "#ef4444",
  errorLight: "#fef2f2",
  info: "#3b82f6",
  infoLight: "#eff6ff",

  // Neutral
  white: "#ffffff",
  black: "#000000",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",
} as const;

/**
 * Get color CSS variable name
 */
export function getColorVar(colorName: keyof typeof UC_COLORS): string {
  return `--color-${colorName}`;
}

export default UC_COLORS;
