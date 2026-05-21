/**
 * Design Tokens Utilities
 *
 * Helpers para consumir Design Tokens en Web (Tailwind) y Mobile (React Native)
 */
import { spacing, spacingNumeric, fontSize, fontSizeNumeric, typographyStyles } from "./index.js";
/**
 * Get hex color value by path
 * Usage: getColor("primary.500") → "#3B82F6"
 *        getColor("text.primary") → "#111827"
 */
export declare function getColor(path: string): string;
/**
 * Get spacing value (px string)
 * Usage: getSpacing("md") → "12px"
 */
export declare function getSpacing(key: keyof typeof spacing): string;
/**
 * Get spacing value as number (for React Native)
 * Usage: getSpacingNumeric(3) → 12
 */
export declare function getSpacingNumeric(value: keyof typeof spacingNumeric): number;
/**
 * Get font size (px string)
 * Usage: getFontSize("md") → "16px"
 */
export declare function getFontSize(key: keyof typeof fontSize): string;
/**
 * Get font size as number (for React Native)
 * Usage: getFontSizeNumeric("md") → 16
 */
export declare function getFontSizeNumeric(key: keyof typeof fontSizeNumeric): number;
/**
 * Get typography style object
 * Usage: getTypographyStyle("h1")
 * Returns: { fontSize, fontSizeNumeric, fontWeight, lineHeight }
 */
export declare function getTypographyStyle(key: keyof typeof typographyStyles): (typeof typographyStyles)[keyof typeof typographyStyles];
/**
 * Get Tailwind config-compatible tokens
 * For use in tailwind.config.js extend section
 */
export declare function getTailwindTokens(): {
    colors: {
        readonly primary: {
            readonly 50: "#EFF6FF";
            readonly 100: "#DBEAFE";
            readonly 200: "#BFDBFE";
            readonly 300: "#93C5FD";
            readonly 400: "#60A5FA";
            readonly 500: "#3B82F6";
            readonly 600: "#2563EB";
            readonly 700: "#1D4ED8";
            readonly 800: "#1E40AF";
            readonly 900: "#1E3A8A";
        };
        readonly secondary: {
            readonly 50: "#F3E8FF";
            readonly 100: "#E9D5FF";
            readonly 200: "#D8B4FE";
            readonly 300: "#C084FC";
            readonly 400: "#A855F7";
            readonly 500: "#9333EA";
            readonly 600: "#7E22CE";
            readonly 700: "#6D28D9";
            readonly 800: "#5B21B6";
            readonly 900: "#4C1D95";
        };
        readonly success: {
            readonly 50: "#F0FDF4";
            readonly 100: "#DCFCE7";
            readonly 200: "#BBFBCB";
            readonly 300: "#86EFAC";
            readonly 400: "#4ADE80";
            readonly 500: "#22C55E";
            readonly 600: "#16A34A";
            readonly 700: "#15803D";
            readonly 800: "#166534";
            readonly 900: "#145231";
        };
        readonly warning: {
            readonly 50: "#FFFBEB";
            readonly 100: "#FEF3C7";
            readonly 200: "#FDE68A";
            readonly 300: "#FCD34D";
            readonly 400: "#FBBF24";
            readonly 500: "#F59E0B";
            readonly 600: "#D97706";
            readonly 700: "#B45309";
            readonly 800: "#92400E";
            readonly 900: "#78350F";
        };
        readonly error: {
            readonly 50: "#FEF2F2";
            readonly 100: "#FEE2E2";
            readonly 200: "#FECACA";
            readonly 300: "#FCA5A5";
            readonly 400: "#F87171";
            readonly 500: "#EF4444";
            readonly 600: "#DC2626";
            readonly 700: "#B91C1C";
            readonly 800: "#991B1B";
            readonly 900: "#7F1D1D";
        };
        readonly info: {
            readonly 50: "#ECFDF5";
            readonly 100: "#D1FAE5";
            readonly 200: "#A7F3D0";
            readonly 300: "#6EE7B7";
            readonly 400: "#2DD4BF";
            readonly 500: "#06B6D4";
            readonly 600: "#0891B2";
            readonly 700: "#0E7490";
            readonly 800: "#155E75";
            readonly 900: "#164E63";
        };
        readonly neutral: {
            readonly 50: "#F9FAFB";
            readonly 100: "#F3F4F6";
            readonly 200: "#E5E7EB";
            readonly 300: "#D1D5DB";
            readonly 400: "#9CA3AF";
            readonly 500: "#6B7280";
            readonly 600: "#4B5563";
            readonly 700: "#374151";
            readonly 800: "#1F2937";
            readonly 900: "#111827";
        };
        readonly black: "#000000";
        readonly white: "#FFFFFF";
        readonly transparent: "transparent";
    };
    spacing: {
        readonly xs: "4px";
        readonly sm: "8px";
        readonly md: "12px";
        readonly lg: "16px";
        readonly xl: "24px";
        readonly "2xl": "32px";
        readonly "3xl": "40px";
        readonly "4xl": "48px";
        readonly "5xl": "56px";
        readonly "6xl": "64px";
        readonly none: "0px";
        readonly full: "100%";
        readonly auto: "auto";
    };
    padding: {
        readonly xs: "4px";
        readonly sm: "8px";
        readonly md: "12px";
        readonly lg: "16px";
        readonly xl: "24px";
        readonly "2xl": "32px";
    };
    margin: {
        readonly xs: "4px";
        readonly sm: "8px";
        readonly md: "12px";
        readonly lg: "16px";
        readonly xl: "24px";
        readonly "2xl": "32px";
        readonly auto: "auto";
    };
    gap: {
        readonly xs: "4px";
        readonly sm: "8px";
        readonly md: "12px";
        readonly lg: "16px";
        readonly xl: "24px";
        readonly "2xl": "32px";
    };
    borderRadius: {
        readonly none: "0px";
        readonly sm: "2px";
        readonly md: "4px";
        readonly lg: "8px";
        readonly xl: "12px";
        readonly "2xl": "16px";
        readonly "3xl": "24px";
        readonly full: "9999px";
    };
    boxShadow: {
        readonly none: "none";
        readonly sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
        readonly md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
        readonly lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
        readonly xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)";
        readonly "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)";
    };
    fontSize: {
        readonly xs: "12px";
        readonly sm: "14px";
        readonly md: "16px";
        readonly lg: "18px";
        readonly xl: "20px";
        readonly "2xl": "24px";
        readonly "3xl": "30px";
        readonly "4xl": "36px";
        readonly "5xl": "48px";
    };
    fontWeight: {
        readonly thin: 100;
        readonly extralight: 200;
        readonly light: 300;
        readonly normal: 400;
        readonly medium: 500;
        readonly semibold: 600;
        readonly bold: 700;
        readonly extrabold: 800;
        readonly black: 900;
    };
    lineHeight: {
        readonly tight: 1.2;
        readonly normal: 1.5;
        readonly relaxed: 1.75;
        readonly loose: 2;
    };
    letterSpacing: {
        readonly tighter: "-0.05em";
        readonly tight: "-0.025em";
        readonly normal: "0em";
        readonly wide: "0.025em";
        readonly wider: "0.05em";
        readonly widest: "0.1em";
    };
};
/**
 * CSS variable generator (for design token documentation)
 * Generates CSS custom properties for all tokens
 */
export declare function generateCSSVariables(): string;
/**
 * Export all tokens as flat object (for reference)
 */
export declare const allTokens: {
    readonly colors: {
        readonly primary: {
            readonly 50: "#EFF6FF";
            readonly 100: "#DBEAFE";
            readonly 200: "#BFDBFE";
            readonly 300: "#93C5FD";
            readonly 400: "#60A5FA";
            readonly 500: "#3B82F6";
            readonly 600: "#2563EB";
            readonly 700: "#1D4ED8";
            readonly 800: "#1E40AF";
            readonly 900: "#1E3A8A";
        };
        readonly secondary: {
            readonly 50: "#F3E8FF";
            readonly 100: "#E9D5FF";
            readonly 200: "#D8B4FE";
            readonly 300: "#C084FC";
            readonly 400: "#A855F7";
            readonly 500: "#9333EA";
            readonly 600: "#7E22CE";
            readonly 700: "#6D28D9";
            readonly 800: "#5B21B6";
            readonly 900: "#4C1D95";
        };
        readonly success: {
            readonly 50: "#F0FDF4";
            readonly 100: "#DCFCE7";
            readonly 200: "#BBFBCB";
            readonly 300: "#86EFAC";
            readonly 400: "#4ADE80";
            readonly 500: "#22C55E";
            readonly 600: "#16A34A";
            readonly 700: "#15803D";
            readonly 800: "#166534";
            readonly 900: "#145231";
        };
        readonly warning: {
            readonly 50: "#FFFBEB";
            readonly 100: "#FEF3C7";
            readonly 200: "#FDE68A";
            readonly 300: "#FCD34D";
            readonly 400: "#FBBF24";
            readonly 500: "#F59E0B";
            readonly 600: "#D97706";
            readonly 700: "#B45309";
            readonly 800: "#92400E";
            readonly 900: "#78350F";
        };
        readonly error: {
            readonly 50: "#FEF2F2";
            readonly 100: "#FEE2E2";
            readonly 200: "#FECACA";
            readonly 300: "#FCA5A5";
            readonly 400: "#F87171";
            readonly 500: "#EF4444";
            readonly 600: "#DC2626";
            readonly 700: "#B91C1C";
            readonly 800: "#991B1B";
            readonly 900: "#7F1D1D";
        };
        readonly info: {
            readonly 50: "#ECFDF5";
            readonly 100: "#D1FAE5";
            readonly 200: "#A7F3D0";
            readonly 300: "#6EE7B7";
            readonly 400: "#2DD4BF";
            readonly 500: "#06B6D4";
            readonly 600: "#0891B2";
            readonly 700: "#0E7490";
            readonly 800: "#155E75";
            readonly 900: "#164E63";
        };
        readonly neutral: {
            readonly 50: "#F9FAFB";
            readonly 100: "#F3F4F6";
            readonly 200: "#E5E7EB";
            readonly 300: "#D1D5DB";
            readonly 400: "#9CA3AF";
            readonly 500: "#6B7280";
            readonly 600: "#4B5563";
            readonly 700: "#374151";
            readonly 800: "#1F2937";
            readonly 900: "#111827";
        };
        readonly black: "#000000";
        readonly white: "#FFFFFF";
        readonly transparent: "transparent";
    };
    readonly functionalColors: {
        readonly text: {
            readonly primary: "#111827";
            readonly secondary: "#4B5563";
            readonly muted: "#6B7280";
            readonly disabled: "#9CA3AF";
            readonly inverse: "#FFFFFF";
        };
        readonly background: {
            readonly primary: "#FFFFFF";
            readonly secondary: "#F9FAFB";
            readonly tertiary: "#F3F4F6";
            readonly overlay: "rgba(0, 0, 0, 0.5)";
        };
        readonly border: {
            readonly light: "#E5E7EB";
            readonly medium: "#D1D5DB";
            readonly dark: "#9CA3AF";
        };
        readonly interactive: {
            readonly hover: "#EFF6FF";
            readonly active: "#DBEAFE";
            readonly focus: "#3B82F6";
            readonly disabled: "#F3F4F6";
        };
        readonly status: {
            readonly success: "#22C55E";
            readonly warning: "#F59E0B";
            readonly error: "#EF4444";
            readonly info: "#06B6D4";
        };
    };
    readonly spacing: {
        readonly xs: "4px";
        readonly sm: "8px";
        readonly md: "12px";
        readonly lg: "16px";
        readonly xl: "24px";
        readonly "2xl": "32px";
        readonly "3xl": "40px";
        readonly "4xl": "48px";
        readonly "5xl": "56px";
        readonly "6xl": "64px";
        readonly none: "0px";
        readonly full: "100%";
        readonly auto: "auto";
    };
    readonly padding: {
        readonly xs: "4px";
        readonly sm: "8px";
        readonly md: "12px";
        readonly lg: "16px";
        readonly xl: "24px";
        readonly "2xl": "32px";
    };
    readonly margin: {
        readonly xs: "4px";
        readonly sm: "8px";
        readonly md: "12px";
        readonly lg: "16px";
        readonly xl: "24px";
        readonly "2xl": "32px";
        readonly auto: "auto";
    };
    readonly gap: {
        readonly xs: "4px";
        readonly sm: "8px";
        readonly md: "12px";
        readonly lg: "16px";
        readonly xl: "24px";
        readonly "2xl": "32px";
    };
    readonly borderRadius: {
        readonly none: "0px";
        readonly sm: "2px";
        readonly md: "4px";
        readonly lg: "8px";
        readonly xl: "12px";
        readonly "2xl": "16px";
        readonly "3xl": "24px";
        readonly full: "9999px";
    };
    readonly shadows: {
        readonly none: "none";
        readonly sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
        readonly md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
        readonly lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
        readonly xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)";
        readonly "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)";
    };
    readonly fontSize: {
        readonly xs: "12px";
        readonly sm: "14px";
        readonly md: "16px";
        readonly lg: "18px";
        readonly xl: "20px";
        readonly "2xl": "24px";
        readonly "3xl": "30px";
        readonly "4xl": "36px";
        readonly "5xl": "48px";
    };
    readonly fontWeight: {
        readonly thin: 100;
        readonly extralight: 200;
        readonly light: 300;
        readonly normal: 400;
        readonly medium: 500;
        readonly semibold: 600;
        readonly bold: 700;
        readonly extrabold: 800;
        readonly black: 900;
    };
    readonly lineHeight: {
        readonly tight: 1.2;
        readonly normal: 1.5;
        readonly relaxed: 1.75;
        readonly loose: 2;
    };
    readonly letterSpacing: {
        readonly tighter: "-0.05em";
        readonly tight: "-0.025em";
        readonly normal: "0em";
        readonly wide: "0.025em";
        readonly wider: "0.05em";
        readonly widest: "0.1em";
    };
    readonly typographyStyles: {
        readonly h1: {
            readonly fontSize: "36px";
            readonly fontSizeNumeric: 36;
            readonly fontWeight: 700;
            readonly lineHeight: 1.2;
        };
        readonly h2: {
            readonly fontSize: "30px";
            readonly fontSizeNumeric: 30;
            readonly fontWeight: 700;
            readonly lineHeight: 1.2;
        };
        readonly h3: {
            readonly fontSize: "24px";
            readonly fontSizeNumeric: 24;
            readonly fontWeight: 600;
            readonly lineHeight: 1.2;
        };
        readonly h4: {
            readonly fontSize: "20px";
            readonly fontSizeNumeric: 20;
            readonly fontWeight: 600;
            readonly lineHeight: 1.5;
        };
        readonly h5: {
            readonly fontSize: "18px";
            readonly fontSizeNumeric: 18;
            readonly fontWeight: 600;
            readonly lineHeight: 1.5;
        };
        readonly h6: {
            readonly fontSize: "16px";
            readonly fontSizeNumeric: 16;
            readonly fontWeight: 600;
            readonly lineHeight: 1.5;
        };
        readonly bodyLarge: {
            readonly fontSize: "16px";
            readonly fontSizeNumeric: 16;
            readonly fontWeight: 400;
            readonly lineHeight: 1.75;
        };
        readonly bodyMedium: {
            readonly fontSize: "14px";
            readonly fontSizeNumeric: 14;
            readonly fontWeight: 400;
            readonly lineHeight: 1.5;
        };
        readonly bodySmall: {
            readonly fontSize: "12px";
            readonly fontSizeNumeric: 12;
            readonly fontWeight: 400;
            readonly lineHeight: 1.5;
        };
        readonly label: {
            readonly fontSize: "14px";
            readonly fontSizeNumeric: 14;
            readonly fontWeight: 500;
            readonly lineHeight: 1.5;
        };
        readonly caption: {
            readonly fontSize: "12px";
            readonly fontSizeNumeric: 12;
            readonly fontWeight: 400;
            readonly lineHeight: 1.2;
        };
        readonly button: {
            readonly fontSize: "16px";
            readonly fontSizeNumeric: 16;
            readonly fontWeight: 600;
            readonly lineHeight: 1.5;
        };
    };
};
export type AllTokens = typeof allTokens;
//# sourceMappingURL=utils.d.ts.map