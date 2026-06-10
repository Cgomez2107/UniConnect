import { z } from "zod";
export declare const NotificationTypeEnum: z.ZodEnum<["message", "studyGroupApplication", "studyGroupAccepted", "studyGroupRejected", "mention", "friendRequest", "system", "nuevo_evento", "nueva_sesion", "sesion_cancelada", "solicitud_ingreso", "miembro_aceptado", "miembro_rechazado", "asistencia_confirmada", "asistencia_declinada", "recordatorio_sesion", "transferencia_admin_solicitada", "transferencia_admin_aceptada", "transferencia_admin_rechazada", "transferencia_admin_transferida", "admin_role_left", "study_session_cancelled"]>;
export declare const PrioridadEnum: z.ZodEnum<["normal", "urgente", "critica"]>;
export declare const AccionSchema: z.ZodObject<{
    label: z.ZodString;
    endpoint: z.ZodString;
    method: z.ZodOptional<z.ZodEnum<["GET", "POST", "PUT", "DELETE"]>>;
}, "strip", z.ZodTypeAny, {
    label: string;
    endpoint: string;
    method?: "GET" | "POST" | "PUT" | "DELETE" | undefined;
}, {
    label: string;
    endpoint: string;
    method?: "GET" | "POST" | "PUT" | "DELETE" | undefined;
}>;
export declare const NotificationSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["message", "studyGroupApplication", "studyGroupAccepted", "studyGroupRejected", "mention", "friendRequest", "system", "nuevo_evento", "nueva_sesion", "sesion_cancelada", "solicitud_ingreso", "miembro_aceptado", "miembro_rechazado", "asistencia_confirmada", "asistencia_declinada", "recordatorio_sesion", "transferencia_admin_solicitada", "transferencia_admin_aceptada", "transferencia_admin_rechazada", "transferencia_admin_transferida", "admin_role_left", "study_session_cancelled"]>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    actionUrl: z.ZodOptional<z.ZodString>;
    read: z.ZodBoolean;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodString;
    priority: z.ZodOptional<z.ZodEnum<["normal", "urgente", "critica"]>>;
    action: z.ZodOptional<z.ZodObject<{
        label: z.ZodString;
        endpoint: z.ZodString;
        method: z.ZodOptional<z.ZodEnum<["GET", "POST", "PUT", "DELETE"]>>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        endpoint: string;
        method?: "GET" | "POST" | "PUT" | "DELETE" | undefined;
    }, {
        label: string;
        endpoint: string;
        method?: "GET" | "POST" | "PUT" | "DELETE" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "mention" | "message" | "studyGroupApplication" | "studyGroupAccepted" | "studyGroupRejected" | "friendRequest" | "system" | "nuevo_evento" | "nueva_sesion" | "sesion_cancelada" | "solicitud_ingreso" | "miembro_aceptado" | "miembro_rechazado" | "asistencia_confirmada" | "asistencia_declinada" | "recordatorio_sesion" | "transferencia_admin_solicitada" | "transferencia_admin_aceptada" | "transferencia_admin_rechazada" | "transferencia_admin_transferida" | "admin_role_left" | "study_session_cancelled";
    createdAt: string;
    id: string;
    userId: string;
    title: string;
    read: boolean;
    description?: string | undefined;
    data?: Record<string, any> | undefined;
    actionUrl?: string | undefined;
    priority?: "normal" | "urgente" | "critica" | undefined;
    action?: {
        label: string;
        endpoint: string;
        method?: "GET" | "POST" | "PUT" | "DELETE" | undefined;
    } | undefined;
}, {
    type: "mention" | "message" | "studyGroupApplication" | "studyGroupAccepted" | "studyGroupRejected" | "friendRequest" | "system" | "nuevo_evento" | "nueva_sesion" | "sesion_cancelada" | "solicitud_ingreso" | "miembro_aceptado" | "miembro_rechazado" | "asistencia_confirmada" | "asistencia_declinada" | "recordatorio_sesion" | "transferencia_admin_solicitada" | "transferencia_admin_aceptada" | "transferencia_admin_rechazada" | "transferencia_admin_transferida" | "admin_role_left" | "study_session_cancelled";
    createdAt: string;
    id: string;
    userId: string;
    title: string;
    read: boolean;
    description?: string | undefined;
    data?: Record<string, any> | undefined;
    actionUrl?: string | undefined;
    priority?: "normal" | "urgente" | "critica" | undefined;
    action?: {
        label: string;
        endpoint: string;
        method?: "GET" | "POST" | "PUT" | "DELETE" | undefined;
    } | undefined;
}>;
export declare const NotificationDTOSchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    type: z.ZodEnum<["message", "study_group_application", "study_group_accepted", "study_group_rejected", "mention", "friend_request", "system", "nuevo_evento", "nueva_sesion", "sesion_cancelada", "solicitud_ingreso", "miembro_aceptado", "miembro_rechazado", "asistencia_confirmada", "asistencia_declinada", "recordatorio_sesion", "transferencia_admin_solicitada", "transferencia_admin_aceptada", "transferencia_admin_rechazada", "transferencia_admin_transferida", "admin_role_left", "study_session_cancelled"]>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    action_url: z.ZodOptional<z.ZodString>;
    read: z.ZodBoolean;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    created_at: z.ZodString;
    priority: z.ZodOptional<z.ZodEnum<["normal", "urgente", "critica"]>>;
    action: z.ZodOptional<z.ZodObject<{
        label: z.ZodString;
        endpoint: z.ZodString;
        method: z.ZodOptional<z.ZodEnum<["GET", "POST", "PUT", "DELETE"]>>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        endpoint: string;
        method?: "GET" | "POST" | "PUT" | "DELETE" | undefined;
    }, {
        label: string;
        endpoint: string;
        method?: "GET" | "POST" | "PUT" | "DELETE" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "mention" | "message" | "system" | "nuevo_evento" | "nueva_sesion" | "sesion_cancelada" | "solicitud_ingreso" | "miembro_aceptado" | "miembro_rechazado" | "asistencia_confirmada" | "asistencia_declinada" | "recordatorio_sesion" | "transferencia_admin_solicitada" | "transferencia_admin_aceptada" | "transferencia_admin_rechazada" | "transferencia_admin_transferida" | "admin_role_left" | "study_session_cancelled" | "study_group_application" | "study_group_accepted" | "study_group_rejected" | "friend_request";
    id: string;
    created_at: string;
    user_id: string;
    title: string;
    read: boolean;
    description?: string | undefined;
    data?: Record<string, any> | undefined;
    priority?: "normal" | "urgente" | "critica" | undefined;
    action?: {
        label: string;
        endpoint: string;
        method?: "GET" | "POST" | "PUT" | "DELETE" | undefined;
    } | undefined;
    action_url?: string | undefined;
}, {
    type: "mention" | "message" | "system" | "nuevo_evento" | "nueva_sesion" | "sesion_cancelada" | "solicitud_ingreso" | "miembro_aceptado" | "miembro_rechazado" | "asistencia_confirmada" | "asistencia_declinada" | "recordatorio_sesion" | "transferencia_admin_solicitada" | "transferencia_admin_aceptada" | "transferencia_admin_rechazada" | "transferencia_admin_transferida" | "admin_role_left" | "study_session_cancelled" | "study_group_application" | "study_group_accepted" | "study_group_rejected" | "friend_request";
    id: string;
    created_at: string;
    user_id: string;
    title: string;
    read: boolean;
    description?: string | undefined;
    data?: Record<string, any> | undefined;
    priority?: "normal" | "urgente" | "critica" | undefined;
    action?: {
        label: string;
        endpoint: string;
        method?: "GET" | "POST" | "PUT" | "DELETE" | undefined;
    } | undefined;
    action_url?: string | undefined;
}>;
//# sourceMappingURL=notification.schema.d.ts.map