import { z } from "zod";
import { StudySessionSchema, CreateSessionRequestSchema, UpdateAvailabilityRequestSchema, CreateSessionResultSchema } from "../schemas/session.schema.js";
export const ListSessionsParamsSchema = z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    status: z.enum(["scheduled", "cancelled"]).optional(),
});
export const CreateSessionContract = {
    method: "POST",
    path: "/api/v1/study-groups/:requestId/sessions",
    request: CreateSessionRequestSchema,
    response: CreateSessionResultSchema,
};
export const ListSessionsContract = {
    method: "GET",
    path: "/api/v1/study-groups/:requestId/sessions",
    request: ListSessionsParamsSchema,
    response: z.array(StudySessionSchema),
};
export const CancelSessionContract = {
    method: "DELETE",
    path: "/api/v1/study-groups/:requestId/sessions/:sessionId",
    request: z.void(),
    response: StudySessionSchema,
};
export const CancelSessionSeriesContract = {
    method: "DELETE",
    path: "/api/v1/study-groups/:requestId/sessions/series/:seriesId",
    request: z.void(),
    response: z.array(StudySessionSchema),
};
export const UpdateAvailabilityContract = {
    method: "POST",
    path: "/api/v1/study-groups/:requestId/sessions/:sessionId/availability",
    request: UpdateAvailabilityRequestSchema,
    response: StudySessionSchema,
};
//# sourceMappingURL=session.contract.js.map