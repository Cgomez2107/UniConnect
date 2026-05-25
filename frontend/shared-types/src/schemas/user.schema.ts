import { z } from "zod";
import { UuidSchema, DateStringSchema } from "./_common.schema";
import { UserSchema, UserDTOSchema } from "./auth.schema";

export const ProfileSchema = UserSchema.extend({
  bio: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  institution: z.string().max(200).optional(),
  faculty: z.string().max(200).optional(),
  program: z.string().max(200).optional(),
  subjects: z.array(z.string()).optional(),
});

export const ProfileDTOSchema = UserDTOSchema.extend({
  bio: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  institution: z.string().max(200).optional(),
  faculty: z.string().max(200).optional(),
  program: z.string().max(200).optional(),
  subjects: z.array(z.string()).optional(),
});

export const FacultySchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  code: z.string().min(1).max(20),
});

export const FacultyDTOSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  code: z.string().min(1).max(20),
});

export const ProgramSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(200),
  facultyId: UuidSchema,
  description: z.string().max(500).optional(),
  code: z.string().min(1).max(20),
});

export const ProgramDTOSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(200),
  faculty_id: UuidSchema,
  description: z.string().max(500).optional(),
  code: z.string().min(1).max(20),
});

export const SubjectSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(200),
  programId: UuidSchema,
  code: z.string().min(1).max(20),
  description: z.string().max(500).optional(),
  credits: z.number().int().positive().optional(),
});

export const SubjectDTOSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(200),
  program_id: UuidSchema,
  code: z.string().min(1).max(20),
  description: z.string().max(500).optional(),
  credits: z.number().int().positive().optional(),
});

export const UserSubjectSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  subjectId: UuidSchema,
  subject: SubjectSchema,
  enrolledAt: DateStringSchema,
});

export const UserSubjectDTOSchema = z.object({
  id: UuidSchema,
  user_id: UuidSchema,
  subject_id: UuidSchema,
  subject: SubjectDTOSchema,
  enrolled_at: DateStringSchema,
});

export const UserProgramSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  programId: UuidSchema,
  program: ProgramSchema,
  enrolledAt: DateStringSchema,
});

export const UserProgramDTOSchema = z.object({
  id: UuidSchema,
  user_id: UuidSchema,
  program_id: UuidSchema,
  program: ProgramDTOSchema,
  enrolled_at: DateStringSchema,
});
