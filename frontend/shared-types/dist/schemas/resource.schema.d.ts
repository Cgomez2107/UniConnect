import { z } from "zod";
export declare const ResourceTypeEnum: z.ZodEnum<["pdf", "document", "video", "link", "image", "other"]>;
export declare const StudyResourceSchema: z.ZodObject<{
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
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        createdAt: string;
        updatedAt: string;
        profileImageUrl?: string | undefined;
    }, {
        email: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        createdAt: string;
        updatedAt: string;
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
    id: string;
    createdAt: string;
    updatedAt: string;
    url: string;
    title: string;
    tags: string[];
    subjectId: string;
    isPublic: boolean;
    uploaderUserId: string;
    viewCount: number;
    downloadCount: number;
    description?: string | undefined;
    uploader?: {
        email: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        createdAt: string;
        updatedAt: string;
        profileImageUrl?: string | undefined;
    } | undefined;
    subject?: {
        code: string;
        id: string;
        name: string;
        programId: string;
        description?: string | undefined;
        credits?: number | undefined;
    } | undefined;
}, {
    type: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    url: string;
    title: string;
    tags: string[];
    subjectId: string;
    isPublic: boolean;
    uploaderUserId: string;
    viewCount: number;
    downloadCount: number;
    description?: string | undefined;
    uploader?: {
        email: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        createdAt: string;
        updatedAt: string;
        profileImageUrl?: string | undefined;
    } | undefined;
    subject?: {
        code: string;
        id: string;
        name: string;
        programId: string;
        description?: string | undefined;
        credits?: number | undefined;
    } | undefined;
}>;
export declare const StudyResourceDTOSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodString;
    url: z.ZodString;
    uploader_user_id: z.ZodString;
    uploader: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        first_name: z.ZodString;
        last_name: z.ZodString;
        role: z.ZodEnum<["estudiante", "admin"]>;
        profile_image_url: z.ZodOptional<z.ZodString>;
        is_verified: z.ZodBoolean;
        created_at: z.ZodString;
        updated_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    }, {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    }>>;
    subject_id: z.ZodString;
    subject: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        program_id: z.ZodString;
        code: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        credits: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        id: string;
        name: string;
        program_id: string;
        description?: string | undefined;
        credits?: number | undefined;
    }, {
        code: string;
        id: string;
        name: string;
        program_id: string;
        description?: string | undefined;
        credits?: number | undefined;
    }>>;
    tags: z.ZodArray<z.ZodString, "many">;
    view_count: z.ZodNumber;
    download_count: z.ZodNumber;
    is_public: z.ZodBoolean;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: string;
    id: string;
    url: string;
    title: string;
    tags: string[];
    subject_id: string;
    created_at: string;
    updated_at: string;
    uploader_user_id: string;
    view_count: number;
    download_count: number;
    is_public: boolean;
    description?: string | undefined;
    uploader?: {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    } | undefined;
    subject?: {
        code: string;
        id: string;
        name: string;
        program_id: string;
        description?: string | undefined;
        credits?: number | undefined;
    } | undefined;
}, {
    type: string;
    id: string;
    url: string;
    title: string;
    tags: string[];
    subject_id: string;
    created_at: string;
    updated_at: string;
    uploader_user_id: string;
    view_count: number;
    download_count: number;
    is_public: boolean;
    description?: string | undefined;
    uploader?: {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    } | undefined;
    subject?: {
        code: string;
        id: string;
        name: string;
        program_id: string;
        description?: string | undefined;
        credits?: number | undefined;
    } | undefined;
}>;
//# sourceMappingURL=resource.schema.d.ts.map