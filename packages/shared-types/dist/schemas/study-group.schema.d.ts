import { z } from "zod";
export declare const StudyGroupStatusEnum: z.ZodEnum<["activa", "inactiva", "finalizada"]>;
export declare const ApplicationStatusEnum: z.ZodEnum<["pendiente", "aprobada", "rechazada"]>;
export declare const MemberRoleEnum: z.ZodEnum<["admin", "miembro"]>;
export declare const StudyGroupSchema: z.ZodObject<{
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
export declare const StudyGroupDTOSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
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
    status: z.ZodEnum<["activa", "inactiva", "finalizada"]>;
    max_members: z.ZodNumber;
    created_by: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
    member_count: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "activa" | "inactiva" | "finalizada";
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    description: string;
    subject_id: string;
    max_members: number;
    created_by: string;
    subject?: {
        code: string;
        id: string;
        name: string;
        program_id: string;
        description?: string | undefined;
        credits?: number | undefined;
    } | undefined;
    member_count?: number | undefined;
}, {
    status: "activa" | "inactiva" | "finalizada";
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    description: string;
    subject_id: string;
    max_members: number;
    created_by: string;
    subject?: {
        code: string;
        id: string;
        name: string;
        program_id: string;
        description?: string | undefined;
        credits?: number | undefined;
    } | undefined;
    member_count?: number | undefined;
}>;
export declare const StudyGroupMemberSchema: z.ZodObject<{
    id: z.ZodString;
    groupId: z.ZodString;
    userId: z.ZodString;
    user: z.ZodObject<{
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
    }>;
    role: z.ZodEnum<["admin", "miembro"]>;
    joinedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    role: "admin" | "miembro";
    userId: string;
    groupId: string;
    user: {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        profileImageUrl?: string | undefined;
    };
    joinedAt: string;
}, {
    id: string;
    role: "admin" | "miembro";
    userId: string;
    groupId: string;
    user: {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        profileImageUrl?: string | undefined;
    };
    joinedAt: string;
}>;
export declare const StudyGroupMemberDTOSchema: z.ZodObject<{
    id: z.ZodString;
    group_id: z.ZodString;
    user_id: z.ZodString;
    user: z.ZodObject<{
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
    }>;
    role: z.ZodEnum<["admin", "miembro"]>;
    joined_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    role: "admin" | "miembro";
    user_id: string;
    user: {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    };
    group_id: string;
    joined_at: string;
}, {
    id: string;
    role: "admin" | "miembro";
    user_id: string;
    user: {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    };
    group_id: string;
    joined_at: string;
}>;
export declare const StudyRequestSchema: z.ZodObject<{
    id: z.ZodString;
    groupId: z.ZodString;
    userId: z.ZodString;
    user: z.ZodOptional<z.ZodObject<{
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
    message: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["pendiente", "aprobada", "rechazada"]>;
    createdAt: z.ZodString;
    reviewedAt: z.ZodOptional<z.ZodString>;
    reviewedBy: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pendiente" | "rechazada" | "aprobada";
    createdAt: string;
    id: string;
    userId: string;
    groupId: string;
    message?: string | undefined;
    user?: {
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
    reviewedAt?: string | undefined;
    reviewedBy?: string | undefined;
}, {
    status: "pendiente" | "rechazada" | "aprobada";
    createdAt: string;
    id: string;
    userId: string;
    groupId: string;
    message?: string | undefined;
    user?: {
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
    reviewedAt?: string | undefined;
    reviewedBy?: string | undefined;
}>;
export declare const StudyApplicationSchema: z.ZodObject<{
    id: z.ZodString;
    groupId: z.ZodString;
    userId: z.ZodString;
    user: z.ZodObject<{
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
    }>;
    message: z.ZodString;
    status: z.ZodEnum<["pendiente", "aprobada", "rechazada"]>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    status: "pendiente" | "rechazada" | "aprobada";
    createdAt: string;
    id: string;
    userId: string;
    groupId: string;
    user: {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        profileImageUrl?: string | undefined;
    };
}, {
    message: string;
    status: "pendiente" | "rechazada" | "aprobada";
    createdAt: string;
    id: string;
    userId: string;
    groupId: string;
    user: {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        profileImageUrl?: string | undefined;
    };
}>;
export declare const StudyApplicationDTOSchema: z.ZodObject<{
    id: z.ZodString;
    group_id: z.ZodString;
    user_id: z.ZodString;
    user: z.ZodObject<{
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
    }>;
    message: z.ZodString;
    status: z.ZodEnum<["pendiente", "aprobada", "rechazada"]>;
    created_at: z.ZodString;
    reviewed_at: z.ZodOptional<z.ZodString>;
    reviewed_by: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message: string;
    status: "pendiente" | "rechazada" | "aprobada";
    id: string;
    created_at: string;
    user_id: string;
    user: {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    };
    group_id: string;
    reviewed_at?: string | undefined;
    reviewed_by?: string | undefined;
}, {
    message: string;
    status: "pendiente" | "rechazada" | "aprobada";
    id: string;
    created_at: string;
    user_id: string;
    user: {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        first_name: string;
        last_name: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        profile_image_url?: string | undefined;
    };
    group_id: string;
    reviewed_at?: string | undefined;
    reviewed_by?: string | undefined;
}>;
//# sourceMappingURL=study-group.schema.d.ts.map