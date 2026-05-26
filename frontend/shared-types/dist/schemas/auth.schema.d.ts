import { z } from "zod";
export declare const UserRoleEnum: z.ZodEnum<["estudiante", "admin"]>;
export declare const AuthProviderEnum: z.ZodEnum<["email", "google", "github"]>;
export declare const UserSchema: z.ZodObject<{
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
}>;
export declare const AuthProfileSchema: z.ZodObject<{
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
    isOnboarded: z.ZodBoolean;
    lastLoginAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    id: string;
    firstName: string;
    lastName: string;
    role: "estudiante" | "admin";
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
    isOnboarded: boolean;
    profileImageUrl?: string | undefined;
    lastLoginAt?: string | undefined;
}, {
    email: string;
    id: string;
    firstName: string;
    lastName: string;
    role: "estudiante" | "admin";
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
    isOnboarded: boolean;
    profileImageUrl?: string | undefined;
    lastLoginAt?: string | undefined;
}>;
export declare const UserDTOSchema: z.ZodObject<{
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
export declare const AuthProfileDTOSchema: z.ZodObject<{
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
    is_onboarded: z.ZodBoolean;
    last_login_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    id: string;
    role: "estudiante" | "admin";
    first_name: string;
    last_name: string;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
    is_onboarded: boolean;
    profile_image_url?: string | undefined;
    last_login_at?: string | undefined;
}, {
    email: string;
    id: string;
    role: "estudiante" | "admin";
    first_name: string;
    last_name: string;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
    is_onboarded: boolean;
    profile_image_url?: string | undefined;
    last_login_at?: string | undefined;
}>;
//# sourceMappingURL=auth.schema.d.ts.map