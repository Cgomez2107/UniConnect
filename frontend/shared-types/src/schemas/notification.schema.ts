import { z } from "zod";
import { UuidSchema, DateStringSchema, UrlSchema } from "./_common.schema";

export const NotificationTypeEnum = z.enum([
  "message",
  "studyGroupApplication",
  "studyGroupAccepted",
  "studyGroupRejected",
  "mention",
  "friendRequest",
  "system",
  "nuevo_evento",
]);

export const PrioridadEnum = z.enum(["normal", "urgente", "critica"]);

export const AccionSchema = z.object({
  label: z.string().min(1).max(100),
  endpoint: z.string().min(1),
});

export const NotificationSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  type: NotificationTypeEnum,
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  actionUrl: UrlSchema.optional(),
  read: z.boolean(),
  data: z.record(z.any()).optional(),
  createdAt: DateStringSchema,
  priority: PrioridadEnum.optional(),
  action: AccionSchema.optional(),
});

export const NotificationDTOSchema = z.object({
  id: UuidSchema,
  user_id: UuidSchema,
  type: z.enum([
    "message",
    "study_group_application",
    "study_group_accepted",
    "study_group_rejected",
    "mention",
    "friend_request",
    "system",
    "nuevo_evento",
  ]),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  action_url: UrlSchema.optional(),
  read: z.boolean(),
  data: z.record(z.any()).optional(),
  created_at: DateStringSchema,
  priority: PrioridadEnum.optional(),
  action: AccionSchema.optional(),
});
