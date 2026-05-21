import { z } from "zod";
import { UuidSchema, EmailSchema, DateStringSchema } from "./_common.schema";

export const UserRoleEnum = z.enum(["estudiante", "admin"]);
export const AuthProviderEnum = z.enum(["email", "google", "github"]);

export const UserSchema = z.object({
  id: UuidSchema,
  email: EmailSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: UserRoleEnum,
  profileImageUrl: z.string().url().optional(),
  isVerified: z.boolean(),
  createdAt: DateStringSchema,
  updatedAt: DateStringSchema,
});

export const AuthProfileSchema = UserSchema.extend({
  isOnboarded: z.boolean(),
  lastLoginAt: DateStringSchema.optional(),
});

export const UserDTOSchema = z.object({
  id: UuidSchema,
  email: EmailSchema,
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  role: UserRoleEnum,
  profile_image_url: z.string().url().optional(),
  is_verified: z.boolean(),
  created_at: DateStringSchema,
  updated_at: DateStringSchema,
});

export const AuthProfileDTOSchema = UserDTOSchema.extend({
  is_onboarded: z.boolean(),
  last_login_at: DateStringSchema.optional(),
});
