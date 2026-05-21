import { z } from "zod";
import type { ApiContract } from "./_base.contract.js";
export declare const LoginRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
    }, {
        email: string;
        password: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        password: string;
    };
}, {
    body: {
        email: string;
        password: string;
    };
}>;
export declare const LoginResponseSchema: z.ZodObject<{
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
    } & {
        isOnboarded: z.ZodBoolean;
        lastLoginAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        isOnboarded: boolean;
        profileImageUrl?: string | undefined;
        lastLoginAt?: string | undefined;
    }, {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        isOnboarded: boolean;
        profileImageUrl?: string | undefined;
        lastLoginAt?: string | undefined;
    }>;
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    expiresIn: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    user: {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        isOnboarded: boolean;
        profileImageUrl?: string | undefined;
        lastLoginAt?: string | undefined;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}, {
    user: {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        isOnboarded: boolean;
        profileImageUrl?: string | undefined;
        lastLoginAt?: string | undefined;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}>;
export declare const RegisterRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        fullName: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
        fullName: string;
    }, {
        email: string;
        password: string;
        fullName: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        password: string;
        fullName: string;
    };
}, {
    body: {
        email: string;
        password: string;
        fullName: string;
    };
}>;
export declare const RefreshTokenRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        refreshToken: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        refreshToken: string;
    }, {
        refreshToken: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        refreshToken: string;
    };
}, {
    body: {
        refreshToken: string;
    };
}>;
export declare const RegisterResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        fullName: z.ZodString;
        role: z.ZodEnum<["estudiante", "admin"]>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        fullName: string;
    }, {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        fullName: string;
    }>;
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    expiresIn: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    user: {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        fullName: string;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}, {
    user: {
        email: string;
        id: string;
        role: "estudiante" | "admin";
        fullName: string;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}>;
export declare const OAuthSignInUrlResponseSchema: z.ZodObject<{
    url: z.ZodString;
    state: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
    state: string;
}, {
    url: string;
    state: string;
}>;
export declare const OAuthCallbackResponseSchema: z.ZodObject<{
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
    } & {
        isOnboarded: z.ZodBoolean;
        lastLoginAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        isOnboarded: boolean;
        profileImageUrl?: string | undefined;
        lastLoginAt?: string | undefined;
    }, {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        isOnboarded: boolean;
        profileImageUrl?: string | undefined;
        lastLoginAt?: string | undefined;
    }>;
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    expiresIn: z.ZodNumber;
    isNewUser: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    user: {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        isOnboarded: boolean;
        profileImageUrl?: string | undefined;
        lastLoginAt?: string | undefined;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    isNewUser: boolean;
}, {
    user: {
        email: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        firstName: string;
        lastName: string;
        role: "estudiante" | "admin";
        isVerified: boolean;
        isOnboarded: boolean;
        profileImageUrl?: string | undefined;
        lastLoginAt?: string | undefined;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    isNewUser: boolean;
}>;
export declare const LoginContract: ApiContract<typeof LoginRequestSchema, typeof LoginResponseSchema>;
export declare const RegisterContract: ApiContract<typeof RegisterRequestSchema, typeof RegisterResponseSchema>;
export declare const RefreshTokenContract: ApiContract<typeof RefreshTokenRequestSchema, typeof RegisterResponseSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type OAuthSignInUrlResponse = z.infer<typeof OAuthSignInUrlResponseSchema>;
export type OAuthCallbackResponse = z.infer<typeof OAuthCallbackResponseSchema>;
//# sourceMappingURL=auth.contract.d.ts.map