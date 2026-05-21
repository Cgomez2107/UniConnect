import { z } from "zod";
import { EmailSchema } from "../schemas/_common.schema";
import { AuthProfileSchema, UserRoleEnum } from "../schemas/auth.schema";
import type { ApiContract } from "./_base.contract";

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

export const LoginContract: ApiContract<typeof LoginRequestSchema, typeof LoginResponseSchema> = {
  method: "POST",
  path: "/api/v1/auth/login",
  request: LoginRequestSchema,
  response: LoginResponseSchema,
};

export const RegisterContract: ApiContract<typeof RegisterRequestSchema, typeof RegisterResponseSchema> = {
  method: "POST",
  path: "/api/v1/auth/register",
  request: RegisterRequestSchema,
  response: RegisterResponseSchema,
};

export const RefreshTokenContract: ApiContract<typeof RefreshTokenRequestSchema, typeof RegisterResponseSchema> = {
  method: "POST",
  path: "/api/v1/auth/refresh",
  request: RefreshTokenRequestSchema,
  response: RegisterResponseSchema,
};

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type OAuthSignInUrlResponse = z.infer<typeof OAuthSignInUrlResponseSchema>;
export type OAuthCallbackResponse = z.infer<typeof OAuthCallbackResponseSchema>;
