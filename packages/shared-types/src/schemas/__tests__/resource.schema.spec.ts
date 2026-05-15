import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  StudyResourceDTOSchema,
  StudyResourceSchema,
} from "../resource.schema.js";
import { UserSchema } from "../auth.schema.js";
import { SubjectSchema } from "../user.schema.js";
import { snakeToCamel } from "../../lib/mappers.js";

const validResource = {
  id: "550e8400-e29b-41d4-a716-446655440666",
  title: "Apuntes de Álgebra",
  description: "Resumen del primer parcial.",
  type: "pdf",
  url: "https://example.com/apuntes.pdf",
  uploaderUserId: "550e8400-e29b-41d4-a716-446655440000",
  uploader: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "student@ucaldas.edu.co",
    firstName: "Ana",
    lastName: "Gomez",
    role: "estudiante" as const,
    profileImageUrl: "https://example.com/avatar.png",
    isVerified: true,
    createdAt: "2026-05-14T12:00:00.000Z",
    updatedAt: "2026-05-14T12:00:00.000Z",
  },
  subjectId: "550e8400-e29b-41d4-a716-446655440333",
  subject: {
    id: "550e8400-e29b-41d4-a716-446655440333",
    name: "Programación I",
    programId: "550e8400-e29b-41d4-a716-446655440222",
    code: "PROG1",
    description: "Introducción a programación.",
    credits: 4,
  },
  tags: ["algoritmos", "parcial1"],
  viewCount: 12,
  downloadCount: 3,
  isPublic: true,
  createdAt: "2026-05-14T12:00:00.000Z",
  updatedAt: "2026-05-14T12:00:00.000Z",
};

const validResourceDto = {
  id: "550e8400-e29b-41d4-a716-446655440666",
  title: "Apuntes de Álgebra",
  description: "Resumen del primer parcial.",
  type: "pdf",
  url: "https://example.com/apuntes.pdf",
  uploader_user_id: "550e8400-e29b-41d4-a716-446655440000",
  uploader: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "student@ucaldas.edu.co",
    first_name: "Ana",
    last_name: "Gomez",
    role: "estudiante" as const,
    profile_image_url: "https://example.com/avatar.png",
    is_verified: true,
    created_at: "2026-05-14T12:00:00.000Z",
    updated_at: "2026-05-14T12:00:00.000Z",
  },
  subject_id: "550e8400-e29b-41d4-a716-446655440333",
  subject: {
    id: "550e8400-e29b-41d4-a716-446655440333",
    name: "Programación I",
    program_id: "550e8400-e29b-41d4-a716-446655440222",
    code: "PROG1",
    description: "Introducción a programación.",
    credits: 4,
  },
  tags: ["algoritmos", "parcial1"],
  view_count: 12,
  download_count: 3,
  is_public: true,
  created_at: "2026-05-14T12:00:00.000Z",
  updated_at: "2026-05-14T12:00:00.000Z",
};

describe("resource.schema", () => {
  it("accepts a valid StudyResource schema payload", () => {
    const result = StudyResourceSchema.safeParse(validResource);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toHaveLength(2);
      expect(result.data.createdAt).toBe(validResource.createdAt);
      expectTypeOf(result.data).toEqualTypeOf<z.infer<typeof StudyResourceSchema>>();
    }
  });

  it("rejects malformed StudyResource payloads", () => {
    const invalidUuid = StudyResourceSchema.safeParse({
      ...validResource,
      id: "bad-id",
    });
    const invalidUrl = StudyResourceSchema.safeParse({
      ...validResource,
      url: "not-a-url",
    });
    const emptyTitle = StudyResourceSchema.safeParse({
      ...validResource,
      title: "",
    });

    expect(invalidUuid.success).toBe(false);
    expect(invalidUrl.success).toBe(false);
    expect(emptyTitle.success).toBe(false);
  });

  it("accepts a valid StudyResource DTO and transforms snake_case to camelCase", () => {
    const dtoResult = StudyResourceDTOSchema.safeParse(validResourceDto);

    expect(dtoResult.success).toBe(true);
    if (dtoResult.success) {
      const camel = snakeToCamel(dtoResult.data);
      const camelUploader = snakeToCamel(dtoResult.data.uploader!);
      const camelSubject = snakeToCamel(dtoResult.data.subject!);

      expect(camel.uploaderUserId).toBe(validResource.uploaderUserId);
      expect(camel.subjectId).toBe(validResource.subjectId);
      expect(camel.viewCount).toBe(validResource.viewCount);
      expect(camel.downloadCount).toBe(validResource.downloadCount);
      expect(camel.isPublic).toBe(validResource.isPublic);
      expect(camel.createdAt).toBe(validResource.createdAt);
      expect(camel.updatedAt).toBe(validResource.updatedAt);
      expectTypeOf(camel.uploaderUserId).toEqualTypeOf<z.infer<typeof StudyResourceSchema>["uploaderUserId"]>();
      expectTypeOf(camel.subjectId).toEqualTypeOf<z.infer<typeof StudyResourceSchema>["subjectId"]>();
      expectTypeOf(camel.createdAt).toEqualTypeOf<z.infer<typeof StudyResourceSchema>["createdAt"]>();
      expectTypeOf(camel.updatedAt).toEqualTypeOf<z.infer<typeof StudyResourceSchema>["updatedAt"]>();
      expectTypeOf(camelUploader).toEqualTypeOf<z.infer<typeof UserSchema>>();
      expectTypeOf(camelSubject).toEqualTypeOf<z.infer<typeof SubjectSchema>>();
      expectTypeOf(dtoResult.data).toEqualTypeOf<z.infer<typeof StudyResourceDTOSchema>>();
    }
  });

  it("rejects malformed StudyResource DTO payloads", () => {
    const missingSubjectId = StudyResourceDTOSchema.safeParse({
      ...validResourceDto,
      subject_id: undefined,
    });
    const badTimestamp = StudyResourceDTOSchema.safeParse({
      ...validResourceDto,
      created_at: "not-a-date",
    });

    expect(missingSubjectId.success).toBe(false);
    expect(badTimestamp.success).toBe(false);
  });
});
