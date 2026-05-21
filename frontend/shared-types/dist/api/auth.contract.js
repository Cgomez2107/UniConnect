import { z } from "zod";
import { EmailSchema } from "../schemas/_common.schema.js";
import { AuthProfileSchema, UserRoleEnum } from "../schemas/auth.schema.js";
export const LoginRequestSchema = z.object({
    body: z.object({
        email: EmailSchema,
        password: z.string().min(6),
    }),
});
export const LoginResponseSchema = z.object({
    user: AuthProfileSchema,
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresIn: z.number().positive(),
});
export const RegisterRequestSchema = z.object({
    body: z.object({
        email: EmailSchema,
        password: z.string().min(8).max(100),
        fullName: z.string().min(2).max(200),
    }),
});
export const RefreshTokenRequestSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1),
    }),
});
export const RegisterResponseSchema = z.object({
    user: z.object({
        id: z.string().uuid(),
        email: EmailSchema,
        fullName: z.string(),
        role: UserRoleEnum,
    }),
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresIn: z.number().positive(),
});
export const OAuthSignInUrlResponseSchema = z.object({
    url: z.string().url(),
    state: z.string(),
});
export const OAuthCallbackResponseSchema = z.object({
    user: AuthProfileSchema,
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresIn: z.number().positive(),
    isNewUser: z.boolean(),
});
export const LoginContract = {
    method: "POST",
    path: "/api/v1/auth/login",
    request: LoginRequestSchema,
    response: LoginResponseSchema,
};
export const RegisterContract = {
    method: "POST",
    path: "/api/v1/auth/register",
    request: RegisterRequestSchema,
    response: RegisterResponseSchema,
};
export const RefreshTokenContract = {
    method: "POST",
    path: "/api/v1/auth/refresh",
    request: RefreshTokenRequestSchema,
    response: RegisterResponseSchema,
};
//# sourceMappingURL=auth.contract.js.map