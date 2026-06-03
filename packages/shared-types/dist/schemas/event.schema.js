import { z } from "zod";
import { UuidSchema, DateStringSchema, UrlSchema } from "./_common.schema.js";
import { UserSchema, UserDTOSchema } from "./auth.schema.js";
export const EventSchema = z.object({
    id: UuidSchema,
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    eventDate: DateStringSchema,
    location: z.string().max(200).optional(),
    category: z.enum(["academico", "cultural", "deportivo", "otro"]),
    creatorId: UuidSchema,
    creator: UserSchema.optional(),
    capacity: z.number().int().positive().optional(),
    attendeeCount: z.number().int().nonnegative(),
    isOnline: z.boolean(),
    eventUrl: UrlSchema.optional(),
    tags: z.array(z.string().max(50)),
    createdAt: DateStringSchema,
    updatedAt: DateStringSchema,
});
export const EventDTOSchema = z.object({
    id: UuidSchema,
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    event_date: DateStringSchema,
    location: z.string().max(200).optional(),
    category: z.enum(["academico", "cultural", "deportivo", "otro"]),
    creator_id: UuidSchema,
    creator: UserDTOSchema.optional(),
    capacity: z.number().int().positive().optional(),
    attendee_count: z.number().int().nonnegative(),
    is_online: z.boolean(),
    event_url: UrlSchema.optional(),
    tags: z.array(z.string().max(50)),
    created_at: DateStringSchema,
    updated_at: DateStringSchema,
});
//# sourceMappingURL=event.schema.js.map