import { z } from "zod";

export const ChannelNameSchema = z.enum([
  "in_app_websocket",
  "email_institucional",
  "push_movil",
]);

export const EventTypeSchema = z.enum([
  "solicitud_ingreso",
  "miembro_aceptado",
  "miembro_rechazado",
  "transferencia_admin_solicitada",
  "transferencia_admin_aceptada",
  "transferencia_admin_rechazada",
  "transferencia_admin_transferida",
  "admin_role_left",
  "nuevo_evento",
]);

export const ChannelConfigSchema = z.record(ChannelNameSchema, z.boolean());

export const NotificationPreferenceSchema = z.object({
  eventType: EventTypeSchema,
  label: z.string(),
  channels: ChannelConfigSchema,
});

export const UpdatePreferenceBodySchema = z.object({
  eventType: EventTypeSchema,
  canal: ChannelNameSchema,
  active: z.boolean(),
});

export type ChannelName = z.infer<typeof ChannelNameSchema>;
export type EventType = z.infer<typeof EventTypeSchema>;
export type ChannelConfig = z.infer<typeof ChannelConfigSchema>;
export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;
export type UpdatePreferenceBody = z.infer<typeof UpdatePreferenceBodySchema>;
