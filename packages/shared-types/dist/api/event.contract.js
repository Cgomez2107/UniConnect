import { z } from "zod";
import { EventSchema } from "../schemas/event.schema.js";
export const CreateEventRequestSchema = z.object({
    body: z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(2000),
        eventDate: z.string().datetime(),
        location: z.string().max(200).optional(),
        category: z.enum(["academico", "cultural", "deportivo", "otro"]).default("academico"),
        capacity: z.number().int().positive().optional(),
        isOnline: z.boolean().default(false),
        eventUrl: z.string().url().optional(),
        tags: z.array(z.string().max(50)).optional(),
    }),
});
export const CreateEventResponseSchema = z.object({
    event: EventSchema,
});
export const CreateEventContract = {
    method: "POST",
    path: "/api/v1/events",
    request: CreateEventRequestSchema,
    response: CreateEventResponseSchema,
};
//# sourceMappingURL=event.contract.js.map