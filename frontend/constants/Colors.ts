/**
 * UniConnect – Paleta de colores
 * Basada en los colores institucionales de la Universidad de Caldas
 *
 * Azul principal : #0d2852
 * Dorado         : #c8ae7a
 */

const palette = {
  // Institucionales
  ucBlue: "#0d2852",
  ucBlueDark: "#091d3d",
  ucBlueLight: "#1a3d73",
  ucGold: "#c8ae7a",
  ucGoldDark: "#a8904f",
  ucGoldLight: "#ddc99a",

  // Neutros
  white: "#ffffff",
  black: "#0a0a0a",
  gray50: "#f8f9fa",
  gray100: "#f1f3f5",
  gray200: "#e9ecef",
  gray300: "#dee2e6",
  gray400: "#ced4da",
  gray500: "#adb5bd",
  gray600: "#6c757d",
  gray700: "#495057",
  gray800: "#343a40",
  gray900: "#212529",

  // Semánticos
  error: "#dc3545",
  errorLight: "#fff5f5",
  success: "#198754",
  successLight: "#f0fff4",
};

export const Colors = {
  light: {
    // Superficies
    background: palette.gray50,
    surface: palette.white,
    surfaceElevated: palette.white,

    // Marca
    primary: palette.ucBlue,
    primaryDark: palette.ucBlueDark,
    primaryLight: palette.ucBlueLight,
    accent: palette.ucGold,
    accentDark: palette.ucGoldDark,

    // Texto
    text: palette.gray900,
    textPrimary: palette.gray900,
    textSecondary: palette.gray600,
    textPlaceholder: palette.gray400,
    textOnPrimary: palette.white,
    textOnAccent: palette.ucBlue,

    // Bordes e inputs
    border: palette.gray200,
    borderFocus: palette.ucBlue,
    borderError: palette.error,

    // Feedback
    error: palette.error,
    errorBackground: palette.errorLight,
    success: palette.success,
    successBackground: palette.successLight,

    // Iconos / extras
    icon: palette.gray600,
    tabIconDefault: palette.gray400,
    tabIconSelected: palette.ucBlue,
  },

  dark: {
    // Superficies
    background: palette.black,
    surface: palette.gray900,
    surfaceElevated: palette.gray800,

    // Marca  (el azul es demasiado oscuro sobre fondo negro,
    //          usamos el dorado como acento principal en dark)
    primary: palette.ucGold,
    primaryDark: palette.ucGoldDark,
    primaryLight: palette.ucGoldLight,
    accent: palette.ucBlueLight,
    accentDark: palette.ucBlue,

    // Texto
    text: palette.white,
    textPrimary: palette.white,
    textSecondary: palette.gray400,
    textPlaceholder: palette.gray600,
    textOnPrimary: palette.ucBlue,
    textOnAccent: palette.white,

    // Bordes e inputs
    border: palette.gray700,
    borderFocus: palette.ucGold,
    borderError: palette.error,

    // Feedback
    error: "#ff6b6b",
    errorBackground: "#2d1515",
    success: "#51cf66",
    successBackground: "#0d2415",

    // Iconos / extras
    icon: palette.gray400,
    tabIconDefault: palette.gray600,
    tabIconSelected: palette.ucGold,
  },
};

export type ColorScheme = typeof Colors.light;