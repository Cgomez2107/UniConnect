/**
 * Design Tokens - Typography
 *
 * CRÍTICO: Sistema tipográfico consistente para Web (Tailwind) y Mobile (React Native)
 * Base font: Inter (Web), System (Mobile)
 * Naming: size + weight combinations
 */
/** Font sizes (px) */
export declare const fontSize: {
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
/** Font sizes numeric (px, for React Native) */
export declare const fontSizeNumeric: {
    readonly xs: 12;
    readonly sm: 14;
    readonly md: 16;
    readonly lg: 18;
    readonly xl: 20;
    readonly "2xl": 24;
    readonly "3xl": 30;
    readonly "4xl": 36;
    readonly "5xl": 48;
};
/** Font weights */
export declare const fontWeight: {
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
/** Line heights (unitless multiplier for RN, px for Web) */
export declare const lineHeight: {
    readonly tight: 1.2;
    readonly normal: 1.5;
    readonly relaxed: 1.75;
    readonly loose: 2;
};
/** Letter spacing (tracking) */
export declare const letterSpacing: {
    readonly tighter: "-0.05em";
    readonly tight: "-0.025em";
    readonly normal: "0em";
    readonly wide: "0.025em";
    readonly wider: "0.05em";
    readonly widest: "0.1em";
};
/** Predefined typography styles (for convenience) */
export declare const typographyStyles: {
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
/** Font family (descriptive, actual fonts managed in app) */
export declare const fontFamily: {
    readonly sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    readonly mono: "'Fira Code', 'Courier New', monospace";
    readonly serif: "Georgia, serif";
    readonly system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
};
export type FontSize = typeof fontSize;
export type FontWeight = typeof fontWeight;
export type LineHeight = typeof lineHeight;
export type TypographyStyle = typeof typographyStyles;
export type FontFamily = typeof fontFamily;
//# sourceMappingURL=typography.d.ts.map