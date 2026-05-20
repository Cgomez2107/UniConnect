import { z } from "zod";
import { UuidSchema, DateStringSchema } from "./_common.schema.js";
import { UserSchema, UserDTOSchema } from "./auth.schema.js";
import { SubjectSchema, SubjectDTOSchema } from "./user.schema.js";

export const StudyGroupStatusEnum = z.enum(["activa", "inactiva", "finalizada"]);
export const ApplicationStatusEnum = z.enum(["pendiente", "aprobada", "rechazada"]);
export const MemberRoleEnum = z.enum(["admin", "miembro"]);

export const StudyGroupSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  subject: SubjectSchema,
  subjectId: UuidSchema,
  status: StudyGroupStatusEnum,
  maxMembers: z.number().int().positive(),
  createdBy: UuidSchema,
  createdAt: DateStringSchema,
  updatedAt: DateStringSchema,
  memberCount: z.number().int().nonnegative().optional(),
});

export const StudyGroupDTOSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  subject_id: UuidSchema,
  subject: SubjectDTOSchema.optional(),
  status: StudyGroupStatusEnum,
  max_members: z.number().int().positive(),
  created_by: UuidSchema,
  created_at: DateStringSchema,
  updated_at: DateStringSchema,
  member_count: z.number().int().nonnegative().optional(),
});

export const StudyGroupMemberSchema = z.object({
  id: UuidSchema,
  groupId: UuidSchema,
  userId: UuidSchema,
  user: UserSchema,
  role: MemberRoleEnum,
  joinedAt: DateStringSchema,
});

export const StudyGroupMemberDTOSchema = z.object({
  id: UuidSchema,
  group_id: UuidSchema,
  user_id: UuidSchema,
  user: UserDTOSchema,
  role: MemberRoleEnum,
  joined_at: DateStringSchema,
});

export const StudyRequestSchema = z.object({
  id: UuidSchema,
  groupId: UuidSchema,
  userId: UuidSchema,
  user: UserSchema.optional(),
  message: z.string().max(500).optional(),
  status: ApplicationStatusEnum,
  createdAt: DateStringSchema,
  reviewedAt: DateStringSchema.optional(),
  reviewedBy: UuidSchema.optional(),
});

export const StudyApplicationSchema = z.object({
  id: UuidSchema,
  groupId: UuidSchema,
  userId: UuidSchema,
  user: UserSchema,
  message: z.string().min(1).max(500),
  status: ApplicationStatusEnum,
  createdAt: DateStringSchema,
});

export const StudyApplicationDTOSchema = z.object({
  id: UuidSchema,
  group_id: UuidSchema,
  user_id: UuidSchema,
  user: UserDTOSchema,
  message: z.string().min(1).max(500),
  status: ApplicationStatusEnum,
  created_at: DateStringSchema,
  reviewed_at: DateStringSchema.optional(),
  reviewed_by: UuidSchema.optional(),
});
