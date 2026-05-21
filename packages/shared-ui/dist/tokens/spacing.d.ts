/**
 * Design Tokens - Spacing
 *
 * CRÍTICO: Sistema de espaciado consistente para Web (Tailwind) y Mobile (React Native)
 * Base: 4px unit
 * Naming: t-shirt sizes + numeric (xs, sm, md, lg, xl, 2xl, etc.)
 */
/** Base spacing unit: 4px */
export declare const SPACING_UNIT = 4;
export declare const spacing: {
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
/** Numeric spacing values (for RN: use without "px") */
export declare const spacingNumeric: {
    readonly 0: 0;
    readonly 1: 4;
    readonly 2: 8;
    readonly 3: 12;
    readonly 4: 16;
    readonly 6: 24;
    readonly 8: 32;
    readonly 10: 40;
    readonly 12: 48;
    readonly 14: 56;
    readonly 16: 64;
};
/** Padding scale (standard padding values) */
export declare const padding: {
    readonly xs: "4px";
    readonly sm: "8px";
    readonly md: "12px";
    readonly lg: "16px";
    readonly xl: "24px";
    readonly "2xl": "32px";
};
/** Margin scale (standard margin values) */
export declare const margin: {
    readonly xs: "4px";
    readonly sm: "8px";
    readonly md: "12px";
    readonly lg: "16px";
    readonly xl: "24px";
    readonly "2xl": "32px";
    readonly auto: "auto";
};
/** Gap scale (grid/flex gap) */
export declare const gap: {
    readonly xs: "4px";
    readonly sm: "8px";
    readonly md: "12px";
    readonly lg: "16px";
    readonly xl: "24px";
    readonly "2xl": "32px";
};
/** Border radius scale */
export declare const borderRadius: {
    readonly none: "0px";
    readonly sm: "2px";
    readonly md: "4px";
    readonly lg: "8px";
    readonly xl: "12px";
    readonly "2xl": "16px";
    readonly "3xl": "24px";
    readonly full: "9999px";
};
/** Shadow scale (Web-specific, but structured for reference) */
export declare const shadows: {
    readonly none: "none";
    readonly sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
    readonly md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
    readonly lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
    readonly xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)";
    readonly "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)";
};
export type Spacing = typeof spacing;
export type SpacingNumeric = typeof spacingNumeric;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
//# sourceMappingURL=spacing.d.ts.map