import { z } from "zod";
import { UuidSchema, DateStringSchema } from "./_common.schema.js";
export const ResourceTypeEnum = z.enum(["pdf", "document", "video", "link", "image", "other"]);
export const StudyResourceSchema = z.object({
    id: UuidSchema,
    userId: UuidSchema,
    programId: UuidSchema,
    subjectId: UuidSchema,
    title: z.string().min(1).max(200),
    description: z.string().nullable(),
    fileUrl: z.string(),
    fileName: z.string(),
    fileType: z.string().nullable(),
    fileSizeKb: z.number().int().nullable(),
    resourceType: z.string().nullable(),
    ogTitle: z.string().nullable(),
    ogImage: z.string().nullable(),
    ogDescription: z.string().nullable(),
    createdAt: DateStringSchema,
    updatedAt: DateStringSchema,
    profiles: z
        .object({
        fullName: z.string(),
        avatarUrl: z.string().nullable(),
    })
        .optional(),
    subjects: z
        .object({
        name: z.string(),
    })
        .optional(),
});
export const StudyResourceDTOSchema = z.object({
    id: UuidSchema,
    user_id: UuidSchema,
    program_id: UuidSchema,
    subject_id: UuidSchema,
    title: z.string().min(1).max(200),
    description: z.string().nullable(),
    file_url: z.string(),
    file_name: z.string(),
    file_type: z.string().nullable(),
    file_size_kb: z.number().int().nullable(),
    resource_type: z.string().nullable(),
    og_title: z.string().nullable(),
    og_image: z.string().nullable(),
    og_description: z.string().nullable(),
    created_at: DateStringSchema,
    updated_at: DateStringSchema,
    profiles: z
        .object({
        full_name: z.string(),
        avatar_url: z.string().nullable(),
    })
        .optional(),
    subjects: z
        .object({
        name: z.string(),
    })
        .optional(),
});
//# sourceMappingURL=resource.schema.js.map