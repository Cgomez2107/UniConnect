import { z } from "zod";
export const UuidSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const DateStringSchema = z.string().datetime();
export const UrlSchema = z.string().url();
export const PaginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    total: z.number().int().nonnegative().optional(),
});
export const TimestampsSchema = z.object({
    createdAt: DateStringSchema,
    updatedAt: DateStringSchema,
});
//# sourceMappingURL=_common.schema.js.map