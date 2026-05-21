import { z } from "zod";
export declare const GetNotificationsRequestSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        unreadOnly: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        unreadOnly?: boolean | undefined;
    }, {
        page?: number | undefined;
        limit?: number | undefined;
        unreadOnly?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        unreadOnly?: boolean | undefined;
    };
}, {
    query: {
        page?: number | undefined;
        limit?: number | undefined;
        unreadOnly?: boolean | undefined;
    };
}>;
export declare const GetNotificationsResponseSchema: z.ZodObject<{
    notifications: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        type: z.ZodEnum<["message", "studyGroupApplication", "studyGroupAccepted", "studyGroupRejected", "mention", "friendRequest", "system"]>;
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
        }, "strip", z.ZodTypeAny, {
            label: string;
            endpoint: string;
        }, {
            label: string;
            endpoint: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type: "mention" | "message" | "studyGroupApplication" | "studyGroupAccepted" | "studyGroupRejected" | "friendRequest" | "system";
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
        } | undefined;
    }, {
        type: "mention" | "message" | "studyGroupApplication" | "studyGroupAccepted" | "studyGroupRejected" | "friendRequest" | "system";
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
        } | undefined;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    total: number;
    notifications: {
        type: "mention" | "message" | "studyGroupApplication" | "studyGroupAccepted" | "studyGroupRejected" | "friendRequest" | "system";
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
        } | undefined;
    }[];
}, {
    page: number;
    limit: number;
    total: number;
    notifications: {
        type: "mention" | "message" | "studyGroupApplication" | "studyGroupAccepted" | "studyGroupRejected" | "friendRequest" | "system";
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
        } | undefined;
    }[];
}>;
export declare const GetPreferencesResponseSchema: z.ZodObject<{
    preferences: z.ZodArray<z.ZodObject<{
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
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    preferences: {
        label: string;
        eventType: "solicitud_ingreso" | "miembro_aceptado" | "miembro_rechazado" | "transferencia_admin_solicitada" | "transferencia_admin_aceptada" | "transferencia_admin_rechazada" | "transferencia_admin_transferida" | "admin_role_left";
        channels: Partial<Record<"in_app_websocket" | "email_institucional" | "push_movil", boolean>>;
    }[];
}, {
    preferences: {
        label: string;
        eventType: "solicitud_ingreso" | "miembro_aceptado" | "miembro_rechazado" | "transferencia_admin_solicitada" | "transferencia_admin_aceptada" | "transferencia_admin_rechazada" | "transferencia_admin_transferida" | "admin_role_left";
        channels: Partial<Record<"in_app_websocket" | "email_institucional" | "push_movil", boolean>>;
    }[];
}>;
export type GetNotificationsRequest = z.infer<typeof GetNotificationsRequestSchema>;
export type GetNotificationsResponse = z.infer<typeof GetNotificationsResponseSchema>;
export type GetPreferencesResponse = z.infer<typeof GetPreferencesResponseSchema>;
//# sourceMappingURL=notification.contract.d.ts.map