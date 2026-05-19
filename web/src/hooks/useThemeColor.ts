import { useCallback } from "react";

/**
 * Colores de marca UC (UniConnect)
 */
const UC_COLORS = {
  ucBlue: "#0066cc",
  ucGold: "#ffc107",
  ucDark: "#1a1a1a",
  ucLight: "#f5f5f5",
  primary: "#0066cc",
  secondary: "#ffc107",
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  neutral: "#6b7280",
};

type ColorName = keyof typeof UC_COLORS;

/**
 * Hook para acceder a los colores de marca de UC
 *
 * @returns {Object} Métodos de colores
 * @returns {Object} colors - Objeto con todos los colores UC
 * @returns {Function} getColor - Obtiene un color por nombre
 * @returns {Function} toRgb - Convierte hex a RGB
 * @returns {Function} toRgba - Convierte hex a RGBA
 *
 * @example
 * const { colors, getColor } = useThemeColor();
 * const blue = getColor("ucBlue");
 * const rgbBlue = toRgb(blue);
 */
export default function useThemeColor() {
  const getColor = useCallback((name: ColorName | string): string => {
    return UC_COLORS[name as ColorName] || name;
  }, []);

  const hexToRgb = useCallback((hex: string): string | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `${r}, ${g}, ${b}`;
  }, []);

  const toRgb = useCallback((color: string): string | null => {
    const hex = getColor(color);
    return hexToRgb(hex);
  }, [getColor, hexToRgb]);

  const toRgba = useCallback(
    (color: string, alpha: number = 1): string | null => {
      const rgb = toRgb(color);
      if (!rgb) return null;
      return `rgba(${rgb}, ${alpha})`;
    },
    [toRgb]
  );

  return {
    colors: UC_COLORS,
    getColor,
    toRgb,
    toRgba,
  };
}
