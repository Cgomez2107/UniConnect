/**
 * Design Tokens Utilities
 *
 * Helpers para consumir Design Tokens en Web (Tailwind) y Mobile (React Native)
 */

import {
  colors,
  functionalColors,
  spacing,
  spacingNumeric,
  padding,
  margin,
  gap,
  borderRadius,
  shadows,
  fontSize,
  fontSizeNumeric,
  fontWeight,
  lineHeight,
  letterSpacing,
  typographyStyles,
} from "./index.js";

/**
 * Get hex color value by path
 * Usage: getColor("primary.500") → "#3B82F6"
 *        getColor("text.primary") → "#111827"
 */
export function getColor(path: string): string {
  const parts = path.split(".");
  let current: any = { colors, functionalColors };

  // Support both "colors.primary.500" and "primary.500"
  if (current[parts[0]]) {
    current = current[parts[0]];
  }

  for (const part of parts) {
    if (current[part] !== undefined) {
      current = current[part];
    } else {
      console.warn(`Color token not found: ${path}`);
      return "#000000"; // Fallback
    }
  }

  return current;
}

/**
 * Get spacing value (px string)
 * Usage: getSpacing("md") → "12px"
 */
export function getSpacing(key: keyof typeof spacing): string {
  return spacing[key];
}

/**
 * Get spacing value as number (for React Native)
 * Usage: getSpacingNumeric(3) → 12
 */
export function getSpacingNumeric(value: keyof typeof spacingNumeric): number {
  return spacingNumeric[value];
}

/**
 * Get font size (px string)
 * Usage: getFontSize("md") → "16px"
 */
export function getFontSize(key: keyof typeof fontSize): string {
  return fontSize[key];
}

/**
 * Get font size as number (for React Native)
 * Usage: getFontSizeNumeric("md") → 16
 */
export function getFontSizeNumeric(key: keyof typeof fontSizeNumeric): number {
  return fontSizeNumeric[key];
}

/**
 * Get typography style object
 * Usage: getTypographyStyle("h1")
 * Returns: { fontSize, fontSizeNumeric, fontWeight, lineHeight }
 */
export function getTypographyStyle(
  key: keyof typeof typographyStyles
): (typeof typographyStyles)[keyof typeof typographyStyles] {
  return typographyStyles[key];
}

/**
 * Get Tailwind config-compatible tokens
 * For use in tailwind.config.js extend section
 */
export function getTailwindTokens() {
  return {
    colors,
    spacing,
    padding,
    margin,
    gap,
    borderRadius,
    boxShadow: shadows,
    fontSize,
    fontWeight,
    lineHeight,
    letterSpacing,
  };
}

/**
 * CSS variable generator (for design token documentation)
 * Generates CSS custom properties for all tokens
 */
export function generateCSSVariables(): string {
  const vars: string[] = [];

  // Colors
  Object.entries(colors).forEach(([key, scale]) => {
    if (typeof scale === "object") {
      Object.entries(scale).forEach(([weight, value]) => {
        vars.push(`  --color-${key}-${weight}: ${value};`);
      });
    }
  });

  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    vars.push(`  --spacing-${key}: ${value};`);
  });

  // Font sizes
  Object.entries(fontSize).forEach(([key, value]) => {
    vars.push(`  --font-size-${key}: ${value};`);
  });

  // Border radius
  Object.entries(borderRadius).forEach(([key, value]) => {
    vars.push(`  --border-radius-${key}: ${value};`);
  });

  return `:root {\n${vars.join("\n")}\n}`;
}

/**
 * Export all tokens as flat object (for reference)
 */
export const allTokens = {
  colors,
  functionalColors,
  spacing,
  padding,
  margin,
  gap,
  borderRadius,
  shadows,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  typographyStyles,
} as const;

export type AllTokens = typeof allTokens;
