import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  StudyResourceDTOSchema,
  StudyResourceSchema,
} from "../resource.schema.js";
import { snakeToCamel } from "../../lib/mappers.js";

const validResource = {
  id: "550e8400-e29b-41d4-a716-446655440666",
  userId: "550e8400-e29b-41d4-a716-446655440000",
  programId: "550e8400-e29b-41d4-a716-446655440111",
  subjectId: "550e8400-e29b-41d4-a716-446655440333",
  title: "Apuntes de Álgebra",
  description: "Resumen del primer parcial.",
  fileUrl: "https://example.com/apuntes.pdf",
  fileName: "apuntes.pdf",
  fileType: "pdf",
  fileSizeKb: 1024,
  resourceType: "pdf",
  ogTitle: null,
  ogImage: null,
  ogDescription: null,
  createdAt: "2026-05-14T12:00:00.000Z",
  updatedAt: "2026-05-14T12:00:00.000Z",
  profiles: {
    fullName: "Ana Gomez",
    avatarUrl: "https://example.com/avatar.png",
  },
  subjects: {
    name: "Programación I",
  },
};

const validResourceDto = {
  id: "550e8400-e29b-41d4-a716-446655440666",
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  program_id: "550e8400-e29b-41d4-a716-446655440111",
  subject_id: "550e8400-e29b-41d4-a716-446655440333",
  title: "Apuntes de Álgebra",
  description: "Resumen del primer parcial.",
  file_url: "https://example.com/apuntes.pdf",
  file_name: "apuntes.pdf",
  file_type: "pdf",
  file_size_kb: 1024,
  resource_type: "pdf",
  og_title: null,
  og_image: null,
  og_description: null,
  created_at: "2026-05-14T12:00:00.000Z",
  updated_at: "2026-05-14T12:00:00.000Z",
  profiles: {
    full_name: "Ana Gomez",
    avatar_url: "https://example.com/avatar.png",
  },
  subjects: {
    name: "Programación I",
  },
};

describe("resource.schema", () => {
  it("accepts a valid StudyResource schema payload", () => {
    const result = StudyResourceSchema.safeParse(validResource);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fileUrl).toBe(validResource.fileUrl);
      expect(result.data.createdAt).toBe(validResource.createdAt);
      expectTypeOf(result.data).toEqualTypeOf<z.infer<typeof StudyResourceSchema>>();
    }
  });

  it("rejects malformed StudyResource payloads", () => {
    const invalidUuid = StudyResourceSchema.safeParse({
      ...validResource,
      id: "bad-id",
    });
    const emptyTitle = StudyResourceSchema.safeParse({
      ...validResource,
      title: "",
    });

    expect(invalidUuid.success).toBe(false);
    expect(emptyTitle.success).toBe(false);
  });

  it("accepts a valid StudyResource DTO and transforms snake_case to camelCase", () => {
    const dtoResult = StudyResourceDTOSchema.safeParse(validResourceDto);

    expect(dtoResult.success).toBe(true);
    if (dtoResult.success) {
      const camel = snakeToCamel(dtoResult.data);

      expect(camel.userId).toBe(validResource.userId);
      expect(camel.subjectId).toBe(validResource.subjectId);
      expect(camel.fileUrl).toBe(validResource.fileUrl);
      expect(camel.resourceType).toBe(validResource.resourceType);
      expect(camel.createdAt).toBe(validResource.createdAt);
      expect(camel.updatedAt).toBe(validResource.updatedAt);
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
