import { z } from "zod";
import type { ApiContract } from "./_base.contract";
export declare const CreateResourceRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        url: z.ZodString;
        subjectId: z.ZodString;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        isPublic: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        subjectId: string;
        url: string;
        title: string;
        isPublic: boolean;
        description?: string | undefined;
        tags?: string[] | undefined;
    }, {
        subjectId: string;
        url: string;
        title: string;
        description?: string | undefined;
        tags?: string[] | undefined;
        isPublic?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        subjectId: string;
        url: string;
        title: string;
        isPublic: boolean;
        description?: string | undefined;
        tags?: string[] | undefined;
    };
}, {
    body: {
        subjectId: string;
        url: string;
        title: string;
        description?: string | undefined;
        tags?: string[] | undefined;
        isPublic?: boolean | undefined;
    };
}>;
export declare const CreateResourceResponseSchema: z.ZodObject<{
    resource: z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        type: z.ZodString;
        url: z.ZodString;
        uploaderUserId: z.ZodString;
        uploader: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            firstName: z.ZodString;
            lastName: z.ZodString;
            role: z.ZodEnum<["estudiante", "admin"]>;
            profileImageUrl: z.ZodOptional<z.ZodString>;
            isVerified: z.ZodBoolean;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        }, {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        }>>;
        subjectId: z.ZodString;
        subject: z.ZodOptional<z.ZodObject<{
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
        }>>;
        tags: z.ZodArray<z.ZodString, "many">;
        viewCount: z.ZodNumber;
        downloadCount: z.ZodNumber;
        isPublic: z.ZodBoolean;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        subjectId: string;
        url: string;
        title: string;
        uploaderUserId: string;
        tags: string[];
        viewCount: number;
        downloadCount: number;
        isPublic: boolean;
        description?: string | undefined;
        subject?: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        } | undefined;
        uploader?: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        } | undefined;
    }, {
        type: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        subjectId: string;
        url: string;
        title: string;
        uploaderUserId: string;
        tags: string[];
        viewCount: number;
        downloadCount: number;
        isPublic: boolean;
        description?: string | undefined;
        subject?: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        } | undefined;
        uploader?: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    resource: {
        type: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        subjectId: string;
        url: string;
        title: string;
        uploaderUserId: string;
        tags: string[];
        viewCount: number;
        downloadCount: number;
        isPublic: boolean;
        description?: string | undefined;
        subject?: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        } | undefined;
        uploader?: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        } | undefined;
    };
}, {
    resource: {
        type: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        subjectId: string;
        url: string;
        title: string;
        uploaderUserId: string;
        tags: string[];
        viewCount: number;
        downloadCount: number;
        isPublic: boolean;
        description?: string | undefined;
        subject?: {
            code: string;
            id: string;
            name: string;
            programId: string;
            description?: string | undefined;
            credits?: number | undefined;
        } | undefined;
        uploader?: {
            email: string;
            createdAt: string;
            updatedAt: string;
            id: string;
            firstName: string;
            lastName: string;
            role: "estudiante" | "admin";
            isVerified: boolean;
            profileImageUrl?: string | undefined;
        } | undefined;
    };
}>;
export declare const CreateResourceContract: ApiContract<typeof CreateResourceRequestSchema, typeof CreateResourceResponseSchema>;
export type CreateResourceRequest = z.infer<typeof CreateResourceRequestSchema>;
export type CreateResourceResponse = z.infer<typeof CreateResourceResponseSchema>;
//# sourceMappingURL=resource.contract.d.ts.map