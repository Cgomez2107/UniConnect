import { z } from "zod";
export declare const ResourceTypeEnum: z.ZodEnum<["pdf", "document", "video", "link", "image", "other"]>;
export declare const StudyResourceSchema: z.ZodObject<{
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
export declare const StudyResourceDTOSchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    program_id: z.ZodString;
    subject_id: z.ZodString;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    file_url: z.ZodString;
    file_name: z.ZodString;
    file_type: z.ZodNullable<z.ZodString>;
    file_size_kb: z.ZodNullable<z.ZodNumber>;
    resource_type: z.ZodNullable<z.ZodString>;
    og_title: z.ZodNullable<z.ZodString>;
    og_image: z.ZodNullable<z.ZodString>;
    og_description: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
    profiles: z.ZodOptional<z.ZodObject<{
        full_name: z.ZodString;
        avatar_url: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        avatar_url: string | null;
        full_name: string;
    }, {
        avatar_url: string | null;
        full_name: string;
    }>>;
    subjects: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
    }, {
        name: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    updated_at: string;
    description: string | null;
    program_id: string;
    user_id: string;
    subject_id: string;
    title: string;
    file_url: string;
    file_name: string;
    file_type: string | null;
    file_size_kb: number | null;
    resource_type: string | null;
    og_title: string | null;
    og_image: string | null;
    og_description: string | null;
    subjects?: {
        name: string;
    } | undefined;
    profiles?: {
        avatar_url: string | null;
        full_name: string;
    } | undefined;
}, {
    id: string;
    created_at: string;
    updated_at: string;
    description: string | null;
    program_id: string;
    user_id: string;
    subject_id: string;
    title: string;
    file_url: string;
    file_name: string;
    file_type: string | null;
    file_size_kb: number | null;
    resource_type: string | null;
    og_title: string | null;
    og_image: string | null;
    og_description: string | null;
    subjects?: {
        name: string;
    } | undefined;
    profiles?: {
        avatar_url: string | null;
        full_name: string;
    } | undefined;
}>;
//# sourceMappingURL=resource.schema.d.ts.map