import { z } from "zod";
import type { ApiContract } from "./_base.contract";
export declare const CreateGroupRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        subjectId: z.ZodString;
        maxMembers: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        subjectId: string;
        maxMembers: number;
    }, {
        name: string;
        description: string;
        subjectId: string;
        maxMembers: number;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        description: string;
        subjectId: string;
        maxMembers: number;
    };
}, {
    body: {
        name: string;
        description: string;
        subjectId: string;
        maxMembers: number;
    };
}>;
export declare const CreateGroupResponseSchema: z.ZodObject<{
    group: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        subject: z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            programId: z.ZodString;
            code: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            credits: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        }, {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        }>;
        subjectId: z.ZodString;
        status: z.ZodEnum<["activa", "inactiva", "finalizada"]>;
        maxMembers: z.ZodNumber;
        createdBy: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        memberCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    }, {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    group: {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    };
}, {
    group: {
        status: "activa" | "inactiva" | "finalizada";
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        description: string;
        subjectId: string;
        subject: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        };
        maxMembers: number;
        createdBy: string;
        memberCount?: number | undefined;
    };
}>;
export declare const JoinGroupRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        groupId: z.ZodString;
        message: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        groupId: string;
        message?: string | undefined;
    }, {
        groupId: string;
        message?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        groupId: string;
        message?: string | undefined;
    };
}, {
    body: {
        groupId: string;
        message?: string | undefined;
    };
}>;
export declare const JoinGroupResponseSchema: z.ZodObject<{
    applicationId: z.ZodString;
    status: z.ZodEnum<["pendiente", "aprobada", "rechazada"]>;
}, "strip", z.ZodTypeAny, {
    status: "pendiente" | "rechazada" | "aprobada";
    applicationId: string;
}, {
    status: "pendiente" | "rechazada" | "aprobada";
    applicationId: string;
}>;
export declare const CreateGroupContract: ApiContract<typeof CreateGroupRequestSchema, typeof CreateGroupResponseSchema>;
export type CreateGroupRequest = z.infer<typeof CreateGroupRequestSchema>;
export type CreateGroupResponse = z.infer<typeof CreateGroupResponseSchema>;
export type JoinGroupRequest = z.infer<typeof JoinGroupRequestSchema>;
export type JoinGroupResponse = z.infer<typeof JoinGroupResponseSchema>;
//# sourceMappingURL=study-group.contract.d.ts.map