/**
 * Design Tokens - Colors
 *
 * CRÍTICO: Única fuente de la verdad visual para Web (Tailwind) y Mobile (React Native)
 * Hexadecimales - compatible con ambas plataformas
 * Naming: semantic (primary, secondary, etc.) + functional (success, warning, error)
 */
/** Semantic Colors */
export declare const colors: {
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
/** Functional Colors (semantic usage) */
export declare const functionalColors: {
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
export type ColorScale = typeof colors;
export type FunctionalColors = typeof functionalColors;
//# sourceMappingURL=colors.d.ts.map