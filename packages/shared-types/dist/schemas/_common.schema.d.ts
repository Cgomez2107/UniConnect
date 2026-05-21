import { z } from "zod";
export declare const UuidSchema: z.ZodString;
export declare const EmailSchema: z.ZodString;
export declare const DateStringSchema: z.ZodString;
export declare const UrlSchema: z.ZodString;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    total: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    total?: number | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    total?: number | undefined;
}>;
export declare const TimestampsSchema: z.ZodObject<{
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    updatedAt: string;
}, {
    createdAt: string;
    updatedAt: string;
}>;
//# sourceMappingURL=_common.schema.d.ts.map