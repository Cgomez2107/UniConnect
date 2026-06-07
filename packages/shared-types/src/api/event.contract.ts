import { z } from "zod";
import { EventSchema } from "../schemas/event.schema.js";
import type { ApiContract } from "./_base.contract.js";

export const CreateEventRequestSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    eventDate: z.string().datetime(),
    location: z.string().max(200).optional(),
    category: z.string().default("academico"),
    capacity: z.number().int().positive().optional(),
    isOnline: z.boolean().default(false),
    eventUrl: z.string().url().optional(),
    tags: z.array(z.string().max(50)).optional(),
  }),
});

export const CreateEventResponseSchema = z.object({
  event: EventSchema,
});

export const CreateEventContract: ApiContract<typeof CreateEventRequestSchema, typeof CreateEventResponseSchema> = {
  method: "POST",
  path: "/api/v1/events",
  request: CreateEventRequestSchema,
  response: CreateEventResponseSchema,
};

export type CreateEventRequest = z.infer<typeof CreateEventRequestSchema>;
export type CreateEventResponse = z.infer<typeof CreateEventResponseSchema>;
