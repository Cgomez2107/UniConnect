import { z } from "zod";
export declare const NotificationTypeEnum: z.ZodEnum<["message", "studyGroupApplication", "studyGroupAccepted", "studyGroupRejected", "mention", "friendRequest", "system"]>;
export declare const PrioridadEnum: z.ZodEnum<["normal", "urgente", "critica"]>;
export declare const AccionSchema: z.ZodObject<{
    label: z.ZodString;
    endpoint: z.ZodString;
}, "strip", z.ZodTypeAny, {
    label: string;
    endpoint: string;
}, {
    label: string;
    endpoint: string;
}>;
export declare const NotificationSchema: z.ZodObject<{
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
}>;
export declare const NotificationDTOSchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    type: z.ZodEnum<["message", "study_group_application", "study_group_accepted", "study_group_rejected", "mention", "friend_request", "system"]>;
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
    }, "strip", z.ZodTypeAny, {
        label: string;
        endpoint: string;
    }, {
        label: string;
        endpoint: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "mention" | "message" | "system" | "study_group_application" | "study_group_accepted" | "study_group_rejected" | "friend_request";
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
    } | undefined;
    action_url?: string | undefined;
}, {
    type: "mention" | "message" | "system" | "study_group_application" | "study_group_accepted" | "study_group_rejected" | "friend_request";
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
    } | undefined;
    action_url?: string | undefined;
}>;
//# sourceMappingURL=notification.schema.d.ts.map