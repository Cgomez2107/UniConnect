import { useState, useCallback, useEffect } from "react";

/**
 * Colores del esquema claro
 */
const LIGHT_COLORS = {
  background: "#ffffff",
  foreground: "#000000",
  surface: "#f9fafb",
  surfaceHover: "#f3f4f6",
  border: "#e5e7eb",
  text: "#1f2937",
  textSecondary: "#6b7280",
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
};

/**
 * Colores del esquema oscuro
 */
const DARK_COLORS = {
  background: "#0f172a",
  foreground: "#f8fafc",
  surface: "#1e293b",
  surfaceHover: "#334155",
  border: "#475569",
  text: "#f8fafc",
  textSecondary: "#cbd5e1",
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
};

/**
 * Hook para gestionar el esquema de colores (light/dark mode)
 *
 * @returns {Object} Colores y controles
 * @returns {Object} colors - Objeto con colores light y dark
 * @returns {boolean} isDark - Indica si está en modo oscuro
 * @returns {Function} toggleDarkMode - Alterna entre light y dark mode
 * @returns {Function} setDarkMode - Establece el modo oscuro explícitamente
 *
 * @example
 * const { colors, isDark, toggleDarkMode } = useColorScheme();
 * const currentColors = isDark ? colors.dark : colors.light;
 */
export default function useColorScheme() {
  const [isDark, setIsDark] = useState(() => {
    // Obtener preferencia del localStorage o del sistema
    const saved = localStorage.getItem("uc-dark-mode");
    if (saved !== null) {
      return saved === "true";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Sincronizar con el DOM
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("uc-dark-mode", isDark.toString());
  }, [isDark]);

  const toggleDarkMode = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const setDarkMode = useCallback((dark: boolean) => {
    setIsDark(dark);
  }, []);

  return {
    colors: {
      light: LIGHT_COLORS,
      dark: DARK_COLORS,
    },
    isDark,
    toggleDarkMode,
    setDarkMode,
  };
}
