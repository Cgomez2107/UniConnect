import { z } from "zod";
export declare const ChannelNameSchema: z.ZodEnum<["in_app_websocket", "email_institucional", "push_movil"]>;
export declare const EventTypeSchema: z.ZodEnum<["solicitud_ingreso", "miembro_aceptado", "miembro_rechazado", "transferencia_admin_solicitada", "transferencia_admin_aceptada", "transferencia_admin_rechazada", "transferencia_admin_transferida", "admin_role_left"]>;
export declare const ChannelConfigSchema: z.ZodRecord<z.ZodEnum<["in_app_websocket", "email_institucional", "push_movil"]>, z.ZodBoolean>;
export declare const NotificationPreferenceSchema: z.ZodObject<{
    eventType: z.ZodEnum<["solicitud_ingreso", "miembro_aceptado", "miembro_rechazado", "transferencia_admin_solicitada", "transferencia_admin_aceptada", "transferencia_admin_rechazada", "transferencia_admin_transferida", "admin_role_left"]>;
    label: z.ZodString;
    channels: z.ZodRecord<z.ZodEnum<["in_app_websocket", "email_institucional", "push_movil"]>, z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    label: string;
    eventType: "solicitud_ingreso" | "miembro_aceptado" | "miembro_rechazado" | "transferencia_admin_solicitada" | "transferencia_admin_aceptada" | "transferencia_admin_rechazada" | "transferencia_admin_transferida" | "admin_role_left";
    channels: Partial<Record<"in_app_websocket" | "email_institucional" | "push_movil", boolean>>;
}, {
    label: string;
    eventType: "solicitud_ingreso" | "miembro_aceptado" | "miembro_rechazado" | "transferencia_admin_solicitada" | "transferencia_admin_aceptada" | "transferencia_admin_rechazada" | "transferencia_admin_transferida" | "admin_role_left";
    channels: Partial<Record<"in_app_websocket" | "email_institucional" | "push_movil", boolean>>;
}>;
export declare const UpdatePreferenceBodySchema: z.ZodObject<{
    eventType: z.ZodEnum<["solicitud_ingreso", "miembro_aceptado", "miembro_rechazado", "transferencia_admin_solicitada", "transferencia_admin_aceptada", "transferencia_admin_rechazada", "transferencia_admin_transferida", "admin_role_left"]>;
    canal: z.ZodEnum<["in_app_websocket", "email_institucional", "push_movil"]>;
    active: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    eventType: "solicitud_ingreso" | "miembro_aceptado" | "miembro_rechazado" | "transferencia_admin_solicitada" | "transferencia_admin_aceptada" | "transferencia_admin_rechazada" | "transferencia_admin_transferida" | "admin_role_left";
    canal: "in_app_websocket" | "email_institucional" | "push_movil";
}, {
    active: boolean;
    eventType: "solicitud_ingreso" | "miembro_aceptado" | "miembro_rechazado" | "transferencia_admin_solicitada" | "transferencia_admin_aceptada" | "transferencia_admin_rechazada" | "transferencia_admin_transferida" | "admin_role_left";
    canal: "in_app_websocket" | "email_institucional" | "push_movil";
}>;
export type ChannelName = z.infer<typeof ChannelNameSchema>;
export type EventType = z.infer<typeof EventTypeSchema>;
export type ChannelConfig = z.infer<typeof ChannelConfigSchema>;
export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;
export type UpdatePreferenceBody = z.infer<typeof UpdatePreferenceBodySchema>;
//# sourceMappingURL=notification-preference.schema.d.ts.map