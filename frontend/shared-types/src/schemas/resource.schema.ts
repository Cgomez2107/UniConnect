import { z } from "zod";
import { UuidSchema, DateStringSchema, UrlSchema } from "./_common.schema";
import { UserSchema, UserDTOSchema } from "./auth.schema";
import { SubjectSchema, SubjectDTOSchema } from "./user.schema";

export const ResourceTypeEnum = z.enum(["pdf", "document", "video", "link", "image", "other"]);

export const StudyResourceSchema = z.object({
  id: UuidSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.string(),
  url: UrlSchema,
  uploaderUserId: UuidSchema,
  uploader: UserSchema.optional(),
  subjectId: UuidSchema,
  subject: SubjectSchema.optional(),
  tags: z.array(z.string().max(50)),
  viewCount: z.number().int().nonnegative(),
  downloadCount: z.number().int().nonnegative(),
  isPublic: z.boolean(),
  createdAt: DateStringSchema,
  updatedAt: DateStringSchema,
});

export const StudyResourceDTOSchema = z.object({
  id: UuidSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.string(),
  url: UrlSchema,
  uploader_user_id: UuidSchema,
  uploader: UserDTOSchema.optional(),
  subject_id: UuidSchema,
  subject: SubjectDTOSchema.optional(),
  tags: z.array(z.string().max(50)),
  view_count: z.number().int().nonnegative(),
  download_count: z.number().int().nonnegative(),
  is_public: z.boolean(),
  created_at: DateStringSchema,
  updated_at: DateStringSchema,
});
