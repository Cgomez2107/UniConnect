import { z } from "zod";
import type { ApiContract } from "./_base.contract.js";
export declare const CreateResourceRequestSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        subjectId: z.ZodString;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        isPublic: z.ZodDefault<z.ZodBoolean>;
        fileUrl: z.ZodOptional<z.ZodString>;
        fileName: z.ZodOptional<z.ZodString>;
        fileType: z.ZodOptional<z.ZodString>;
        fileSizeKb: z.ZodOptional<z.ZodNumber>;
        programId: z.ZodOptional<z.ZodString>;
        resourceType: z.ZodOptional<z.ZodEnum<["file", "link"]>>;
    }, "strip", z.ZodTypeAny, {
        subjectId: string;
        title: string;
        isPublic: boolean;
        description?: string | undefined;
        programId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
        tags?: string[] | undefined;
    }, {
        subjectId: string;
        title: string;
        description?: string | undefined;
        programId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
        tags?: string[] | undefined;
        isPublic?: boolean | undefined;
    }>, {
        subjectId: string;
        title: string;
        isPublic: boolean;
        description?: string | undefined;
        programId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
        tags?: string[] | undefined;
    }, {
        subjectId: string;
        title: string;
        description?: string | undefined;
        programId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
        tags?: string[] | undefined;
        isPublic?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        subjectId: string;
        title: string;
        isPublic: boolean;
        description?: string | undefined;
        programId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
        tags?: string[] | undefined;
    };
}, {
    body: {
        subjectId: string;
        title: string;
        description?: string | undefined;
        programId?: string | undefined;
        url?: string | undefined;
        fileUrl?: string | undefined;
        fileName?: string | undefined;
        fileType?: string | undefined;
        fileSizeKb?: number | undefined;
        resourceType?: "file" | "link" | undefined;
        tags?: string[] | undefined;
        isPublic?: boolean | undefined;
    };
}>;
export declare const CreateResourceResponseSchema: z.ZodObject<{
    resource: z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        programId: z.ZodString;
        subjectId: z.ZodString;
        title: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        fileUrl: z.ZodString;
        fileName: z.ZodString;
        fileType: z.ZodNullable<z.ZodString>;
        fileSizeKb: z.ZodNullable<z.ZodNumber>;
        resourceType: z.ZodNullable<z.ZodString>;
        ogTitle: z.ZodNullable<z.ZodString>;
        ogImage: z.ZodNullable<z.ZodString>;
        ogDescription: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        profiles: z.ZodOptional<z.ZodObject<{
            fullName: z.ZodString;
            avatarUrl: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            avatarUrl: string | null;
            fullName: string;
        }, {
            avatarUrl: string | null;
            fullName: string;
        }>>;
        subjects: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
        }, {
            name: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        createdAt: string;
        updatedAt: string;
        id: string;
        description: string | null;
        programId: string;
        userId: string;
        subjectId: string;
        title: string;
        fileUrl: string;
        fileName: string;
        fileType: string | null;
        fileSizeKb: number | null;
        resourceType: string | null;
        ogTitle: string | null;
        ogImage: string | null;
        ogDescription: string | null;
        subjects?: {
            name: string;
        } | undefined;
        profiles?: {
            avatarUrl: string | null;
            fullName: string;
        } | undefined;
    }, {
        createdAt: string;
        updatedAt: string;
        id: string;
        description: string | null;
        programId: string;
        userId: string;
        subjectId: string;
        title: string;
        fileUrl: string;
        fileName: string;
        fileType: string | null;
        fileSizeKb: number | null;
        resourceType: string | null;
        ogTitle: string | null;
        ogImage: string | null;
        ogDescription: string | null;
        subjects?: {
            name: string;
        } | undefined;
        profiles?: {
            avatarUrl: string | null;
            fullName: string;
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    resource: {
        createdAt: string;
        updatedAt: string;
        id: string;
        description: string | null;
        programId: string;
        userId: string;
        subjectId: string;
        title: string;
        fileUrl: string;
        fileName: string;
        fileType: string | null;
        fileSizeKb: number | null;
        resourceType: string | null;
        ogTitle: string | null;
        ogImage: string | null;
        ogDescription: string | null;
        subjects?: {
            name: string;
        } | undefined;
        profiles?: {
            avatarUrl: string | null;
            fullName: string;
        } | undefined;
    };
}, {
    resource: {
        createdAt: string;
        updatedAt: string;
        id: string;
        description: string | null;
        programId: string;
        userId: string;
        subjectId: string;
        title: string;
        fileUrl: string;
        fileName: string;
        fileType: string | null;
        fileSizeKb: number | null;
        resourceType: string | null;
        ogTitle: string | null;
        ogImage: string | null;
        ogDescription: string | null;
        subjects?: {
            name: string;
        } | undefined;
        profiles?: {
            avatarUrl: string | null;
            fullName: string;
        } | undefined;
    };
}>;
export declare const CreateResourceContract: ApiContract<typeof CreateResourceRequestSchema, typeof CreateResourceResponseSchema>;
export type CreateResourceRequest = z.infer<typeof CreateResourceRequestSchema>;
export type CreateResourceResponse = z.infer<typeof CreateResourceResponseSchema>;
//# sourceMappingURL=resource.contract.d.ts.map