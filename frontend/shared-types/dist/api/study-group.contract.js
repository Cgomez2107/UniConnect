import { z } from "zod";
import { StudyGroupSchema } from "../schemas/study-group.schema.js";
export const CreateGroupRequestSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(200),
        description: z.string().min(1).max(1000),
        subjectId: z.string().uuid(),
        maxMembers: z.number().int().positive().max(50),
    }),
});
export const CreateGroupResponseSchema = z.object({
    group: StudyGroupSchema,
});
export const JoinGroupRequestSchema = z.object({
    body: z.object({
        groupId: z.string().uuid(),
        message: z.string().max(500).optional(),
    }),
});
export const JoinGroupResponseSchema = z.object({
    applicationId: z.string().uuid(),
    status: z.enum(["pendiente", "aprobada", "rechazada"]),
});
export const CreateGroupContract = {
    method: "POST",
    path: "/api/v1/study-groups",
    request: CreateGroupRequestSchema,
    response: CreateGroupResponseSchema,
};
//# sourceMappingURL=study-group.contract.js.map