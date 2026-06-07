import { z } from "zod";
import { UuidSchema, DateStringSchema, UrlSchema } from "./_common.schema.js";

export const NotificationTypeEnum = z.enum([
  "message",
  "studyGroupApplication",
  "studyGroupAccepted",
  "studyGroupRejected",
  "mention",
  "friendRequest",
  "system",
  "nuevo_evento",
  "nueva_sesion",
  "sesion_cancelada",
  "solicitud_ingreso",
  "miembro_aceptado",
  "miembro_rechazado",
  "asistencia_confirmada",
  "asistencia_declinada",
  "recordatorio_sesion",
  "transferencia_admin_solicitada",
  "transferencia_admin_aceptada",
  "transferencia_admin_rechazada",
  "transferencia_admin_transferida",
  "admin_role_left",
  "study_session_cancelled",
]);

export const PrioridadEnum = z.enum(["normal", "urgente", "critica"]);

export const AccionSchema = z.object({
  label: z.string().min(1).max(100),
  endpoint: z.string().min(1),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]).optional(),
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
    "nueva_sesion",
    "sesion_cancelada",
    "solicitud_ingreso",
    "miembro_aceptado",
    "miembro_rechazado",
    "asistencia_confirmada",
    "asistencia_declinada",
    "recordatorio_sesion",
    "transferencia_admin_solicitada",
    "transferencia_admin_aceptada",
    "transferencia_admin_rechazada",
    "transferencia_admin_transferida",
    "admin_role_left",
    "study_session_cancelled",
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
