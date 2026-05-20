import { z } from "zod";
import { NotificationSchema } from "../schemas/notification.schema.js";

export const GetNotificationsRequestSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
    unreadOnly: z.coerce.boolean().optional(),
  }),
});

export const GetNotificationsResponseSchema = z.object({
  notifications: z.array(NotificationSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

export type GetNotificationsRequest = z.infer<typeof GetNotificationsRequestSchema>;
export type GetNotificationsResponse = z.infer<typeof GetNotificationsResponseSchema>;
