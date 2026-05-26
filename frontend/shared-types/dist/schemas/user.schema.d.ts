import { z } from "zod";
export declare const ProfileSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodEnum<["estudiante", "admin"]>;
    profileImageUrl: z.ZodOptional<z.ZodString>;
    isVerified: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
} & {
    bio: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    institution: z.ZodOptional<z.ZodString>;
    faculty: z.ZodOptional<z.ZodString>;
    program: z.ZodOptional<z.ZodString>;
    subjects: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
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
    bio?: string | undefined;
    phone?: string | undefined;
    institution?: string | undefined;
    faculty?: string | undefined;
    program?: string | undefined;
    subjects?: string[] | undefined;
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
    bio?: string | undefined;
    phone?: string | undefined;
    institution?: string | undefined;
    faculty?: string | undefined;
    program?: string | undefined;
    subjects?: string[] | undefined;
}>;
export declare const ProfileDTOSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    first_name: z.ZodString;
    last_name: z.ZodString;
    role: z.ZodEnum<["estudiante", "admin"]>;
    profile_image_url: z.ZodOptional<z.ZodString>;
    is_verified: z.ZodBoolean;
    created_at: z.ZodString;
    updated_at: z.ZodString;
} & {
    bio: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    institution: z.ZodOptional<z.ZodString>;
    faculty: z.ZodOptional<z.ZodString>;
    program: z.ZodOptional<z.ZodString>;
    subjects: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    email: string;
    id: string;
    role: "estudiante" | "admin";
    first_name: string;
    last_name: string;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
    bio?: string | undefined;
    profile_image_url?: string | undefined;
    phone?: string | undefined;
    institution?: string | undefined;
    faculty?: string | undefined;
    program?: string | undefined;
    subjects?: string[] | undefined;
}, {
    email: string;
    id: string;
    role: "estudiante" | "admin";
    first_name: string;
    last_name: string;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
    bio?: string | undefined;
    profile_image_url?: string | undefined;
    phone?: string | undefined;
    institution?: string | undefined;
    faculty?: string | undefined;
    program?: string | undefined;
    subjects?: string[] | undefined;
}>;
export declare const FacultySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    id: string;
    name: string;
    description?: string | undefined;
}, {
    code: string;
    id: string;
    name: string;
    description?: string | undefined;
}>;
export declare const FacultyDTOSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    id: string;
    name: string;
    description?: string | undefined;
}, {
    code: string;
    id: string;
    name: string;
    description?: string | undefined;
}>;
export declare const ProgramSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    facultyId: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    id: string;
    name: string;
    facultyId: string;
    description?: string | undefined;
}, {
    code: string;
    id: string;
    name: string;
    facultyId: string;
    description?: string | undefined;
}>;
export declare const ProgramDTOSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    faculty_id: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    id: string;
    name: string;
    faculty_id: string;
    description?: string | undefined;
}, {
    code: string;
    id: string;
    name: string;
    faculty_id: string;
    description?: string | undefined;
}>;
export declare const SubjectSchema: z.ZodObject<{
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
export declare const SubjectDTOSchema: z.ZodObject<{
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
}>;
export declare const UserSubjectSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    subjectId: z.ZodString;
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
    enrolledAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    subjectId: string;
    userId: string;
    subject: {
        code: string;
        id: string;
        name: string;
        programId: string;
        description?: string | undefined;
        credits?: number | undefined;
    };
    enrolledAt: string;
}, {
    id: string;
    subjectId: string;
    userId: string;
    subject: {
        code: string;
        id: string;
        name: string;
        programId: string;
        description?: string | undefined;
        credits?: number | undefined;
    };
    enrolledAt: string;
}>;
export declare const UserSubjectDTOSchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    subject_id: z.ZodString;
    subject: z.ZodObject<{
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
    }>;
    enrolled_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    subject: {
        code: string;
        id: string;
        name: string;
        program_id: string;
        description?: string | undefined;
        credits?: number | undefined;
    };
    subject_id: string;
    user_id: string;
    enrolled_at: string;
}, {
    id: string;
    subject: {
        code: string;
        id: string;
        name: string;
        program_id: string;
        description?: string | undefined;
        credits?: number | undefined;
    };
    subject_id: string;
    user_id: string;
    enrolled_at: string;
}>;
export declare const UserProgramSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    programId: z.ZodString;
    program: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        facultyId: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        id: string;
        name: string;
        facultyId: string;
        description?: string | undefined;
    }, {
        code: string;
        id: string;
        name: string;
        facultyId: string;
        description?: string | undefined;
    }>;
    enrolledAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    programId: string;
    program: {
        code: string;
        id: string;
        name: string;
        facultyId: string;
        description?: string | undefined;
    };
    enrolledAt: string;
}, {
    id: string;
    userId: string;
    programId: string;
    program: {
        code: string;
        id: string;
        name: string;
        facultyId: string;
        description?: string | undefined;
    };
    enrolledAt: string;
}>;
export declare const UserProgramDTOSchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    program_id: z.ZodString;
    program: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        faculty_id: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        id: string;
        name: string;
        faculty_id: string;
        description?: string | undefined;
    }, {
        code: string;
        id: string;
        name: string;
        faculty_id: string;
        description?: string | undefined;
    }>;
    enrolled_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    program_id: string;
    user_id: string;
    program: {
        code: string;
        id: string;
        name: string;
        faculty_id: string;
        description?: string | undefined;
    };
    enrolled_at: string;
}, {
    id: string;
    program_id: string;
    user_id: string;
    program: {
        code: string;
        id: string;
        name: string;
        faculty_id: string;
        description?: string | undefined;
    };
    enrolled_at: string;
}>;
//# sourceMappingURL=user.schema.d.ts.map