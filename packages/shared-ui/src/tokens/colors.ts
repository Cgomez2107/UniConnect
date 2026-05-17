/**
 * Design Tokens - Colors
 *
 * CRÍTICO: Única fuente de la verdad visual para Web (Tailwind) y Mobile (React Native)
 * Hexadecimales - compatible con ambas plataformas
 * Naming: semantic (primary, secondary, etc.) + functional (success, warning, error)
 */

/** Semantic Colors */
export const colors = {
  // Primary Palette (Blue - main brand)
  primary: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",  // primary base
    600: "#2563EB",
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
  },

  // Secondary Palette (Purple - complementary)
  secondary: {
    50: "#F3E8FF",
    100: "#E9D5FF",
    200: "#D8B4FE",
    300: "#C084FC",
    400: "#A855F7",
    500: "#9333EA",  // secondary base
    600: "#7E22CE",
    700: "#6D28D9",
    800: "#5B21B6",
    900: "#4C1D95",
  },

  // Success (Green)
  success: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    200: "#BBFBCB",
    300: "#86EFAC",
    400: "#4ADE80",
    500: "#22C55E",  // success base
    600: "#16A34A",
    700: "#15803D",
    800: "#166534",
    900: "#145231",
  },

  // Warning (Amber)
  warning: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",  // warning base
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },

  // Error (Red)
  error: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444",  // error base
    600: "#DC2626",
    700: "#B91C1C",
    800: "#991B1B",
    900: "#7F1D1D",
  },

  // Info (Cyan)
  info: {
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    300: "#6EE7B7",
    400: "#2DD4BF",
    500: "#06B6D4",  // info base
    600: "#0891B2",
    700: "#0E7490",
    800: "#155E75",
    900: "#164E63",
  },

  // Neutral (Gray - backgrounds, borders, text)
  neutral: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",  // neutral base
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },

  // Alias de colores neutrales para convenios comunes
  black: "#000000",
  white: "#FFFFFF",
  transparent: "transparent",
} as const;

/** Functional Colors (semantic usage) */
export const functionalColors = {
  // Text
  text: {
    primary: colors.neutral[900],
    secondary: colors.neutral[600],
    muted: colors.neutral[500],
    disabled: colors.neutral[400],
    inverse: colors.white,
  },

  // Backgrounds
  background: {
    primary: colors.white,
    secondary: colors.neutral[50],
    tertiary: colors.neutral[100],
    overlay: "rgba(0, 0, 0, 0.5)",
  },

  // Borders
  border: {
    light: colors.neutral[200],
    medium: colors.neutral[300],
    dark: colors.neutral[400],
  },

  // Interactive states
  interactive: {
    hover: colors.primary[50],
    active: colors.primary[100],
    focus: colors.primary[500],
    disabled: colors.neutral[100],
  },

  // Status indicators
  status: {
    success: colors.success[500],
    warning: colors.warning[500],
    error: colors.error[500],
    info: colors.info[500],
  },
} as const;

export type ColorScale = typeof colors;
export type FunctionalColors = typeof functionalColors;
