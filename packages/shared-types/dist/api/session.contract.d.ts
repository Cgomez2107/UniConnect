import { z } from "zod";
import type { ApiContract } from "./_base.contract.js";
import { StudySessionSchema, CreateSessionRequestSchema, UpdateAvailabilityRequestSchema, CreateSessionResultSchema } from "../schemas/session.schema.js";
export declare const ListSessionsParamsSchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["scheduled", "cancelled"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "scheduled" | "cancelled" | undefined;
    to?: string | undefined;
    from?: string | undefined;
}, {
    status?: "scheduled" | "cancelled" | undefined;
    to?: string | undefined;
    from?: string | undefined;
}>;
export declare const CreateSessionContract: ApiContract<typeof CreateSessionRequestSchema, typeof CreateSessionResultSchema>;
export declare const ListSessionsContract: ApiContract<typeof ListSessionsParamsSchema, z.ZodArray<typeof StudySessionSchema>>;
export declare const CancelSessionContract: ApiContract<z.ZodVoid, typeof StudySessionSchema>;
export declare const CancelSessionSeriesContract: ApiContract<z.ZodVoid, z.ZodArray<typeof StudySessionSchema>>;
export declare const UpdateAvailabilityContract: ApiContract<typeof UpdateAvailabilityRequestSchema, typeof StudySessionSchema>;
//# sourceMappingURL=session.contract.d.ts.map