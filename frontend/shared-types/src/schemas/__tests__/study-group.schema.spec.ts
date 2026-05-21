import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  StudyGroupSchema,
  StudyGroupDTOSchema,
  StudyGroupMemberSchema,
  StudyGroupMemberDTOSchema,
  StudyApplicationSchema,
  StudyApplicationDTOSchema,
} from "../study-group.schema";
import { snakeToCamel } from "../../lib/mappers";

const validSubject = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  name: "Matemáticas Avanzadas",
  programId: "660e8400-e29b-41d4-a716-446655440050",
  code: "MAT-401",
  credits: 4,
};

const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "student@ucaldas.edu.co",
  firstName: "Ana",
  lastName: "Gomez",
  role: "estudiante" as const,
  profileImageUrl: "https://example.com/avatar.png",
  isVerified: true,
  createdAt: "2026-05-14T12:00:00.000Z",
  updatedAt: "2026-05-14T12:00:00.000Z",
};

const validUserDto = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "student@ucaldas.edu.co",
  first_name: "Ana",
  last_name: "Gomez",
  role: "estudiante" as const,
  profile_image_url: "https://example.com/avatar.png",
  is_verified: true,
  created_at: "2026-05-14T12:00:00.000Z",
  updated_at: "2026-05-14T12:00:00.000Z",
};

const validSubjectDto = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  name: "Matemáticas Avanzadas",
  program_id: "660e8400-e29b-41d4-a716-446655440050",
  code: "MAT-401",
  credits: 4,
};

const validStudyGroup = {
  id: "660e8400-e29b-41d4-a716-446655440010",
  name: "Grupo MAT-401",
  description: "Estudio colaborativo para matemáticas avanzadas",
  subject: validSubject,
  subjectId: "550e8400-e29b-41d4-a716-446655440001",
  status: "activa" as const,
  maxMembers: 8,
  createdBy: "550e8400-e29b-41d4-a716-446655440000",
  createdAt: "2026-05-14T12:00:00.000Z",
  updatedAt: "2026-05-14T12:00:00.000Z",
  memberCount: 5,
};

const validStudyGroupDto = {
  id: "660e8400-e29b-41d4-a716-446655440010",
  name: "Grupo MAT-401",
  description: "Estudio colaborativo para matemáticas avanzadas",
  subject_id: "550e8400-e29b-41d4-a716-446655440001",
  subject: validSubjectDto,
  status: "activa" as const,
  max_members: 8,
  created_by: "550e8400-e29b-41d4-a716-446655440000",
  created_at: "2026-05-14T12:00:00.000Z",
  updated_at: "2026-05-14T12:00:00.000Z",
  member_count: 5,
};

const validStudyGroupMember = {
  id: "770e8400-e29b-41d4-a716-446655440020",
  groupId: "660e8400-e29b-41d4-a716-446655440010",
  userId: "550e8400-e29b-41d4-a716-446655440000",
  user: validUser,
  role: "admin" as const,
  joinedAt: "2026-05-14T12:00:00.000Z",
};

const validStudyGroupMemberDto = {
  id: "770e8400-e29b-41d4-a716-446655440020",
  group_id: "660e8400-e29b-41d4-a716-446655440010",
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  user: validUserDto,
  role: "admin" as const,
  joined_at: "2026-05-14T12:00:00.000Z",
};

const validStudyApplication = {
  id: "880e8400-e29b-41d4-a716-446655440030",
  groupId: "660e8400-e29b-41d4-a716-446655440010",
  userId: "550e8400-e29b-41d4-a716-446655440001",
  user: { ...validUser, id: "550e8400-e29b-41d4-a716-446655440001" },
  message: "Quiero unirme al grupo para estudiar juntos",
  status: "pendiente" as const,
  createdAt: "2026-05-14T12:00:00.000Z",
};

const validStudyApplicationDto = {
  id: "880e8400-e29b-41d4-a716-446655440030",
  group_id: "660e8400-e29b-41d4-a716-446655440010",
  user_id: "550e8400-e29b-41d4-a716-446655440001",
  user: { ...validUserDto, id: "550e8400-e29b-41d4-a716-446655440001" },
  message: "Quiero unirme al grupo para estudiar juntos",
  status: "pendiente" as const,
  created_at: "2026-05-14T12:00:00.000Z",
};

describe("study-group.schema", () => {
  describe("StudyGroupSchema", () => {
    it("accepts a valid StudyGroup payload", () => {
      const result = StudyGroupSchema.safeParse(validStudyGroup);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe(validStudyGroup.name);
        expect(result.data.status).toBe("activa");
        expect(result.data.maxMembers).toBe(8);
        expectTypeOf(result.data).toEqualTypeOf<
          z.infer<typeof StudyGroupSchema>
        >();
      }
    });

    it("rejects StudyGroup with empty name or negative maxMembers", () => {
      const emptyName = StudyGroupSchema.safeParse({
        ...validStudyGroup,
        name: "",
      });
      const negativeMaxMembers = StudyGroupSchema.safeParse({
        ...validStudyGroup,
        maxMembers: -1,
      });

      expect(emptyName.success).toBe(false);
      expect(negativeMaxMembers.success).toBe(false);
    });

    it("validates StudyGroup status enum", () => {
      const validStatuses = ["activa", "inactiva", "finalizada"];
      validStatuses.forEach((status) => {
        const result = StudyGroupSchema.safeParse({
          ...validStudyGroup,
          status: status as any,
        });
        expect(result.success).toBe(true);
      });

      const invalidStatus = StudyGroupSchema.safeParse({
        ...validStudyGroup,
        status: "invalida" as any,
      });
      expect(invalidStatus.success).toBe(false);
    });
  });

  describe("StudyGroupDTOSchema", () => {
    it("accepts a valid StudyGroup DTO payload", () => {
      const result = StudyGroupDTOSchema.safeParse(validStudyGroupDto);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe(validStudyGroupDto.name);
        expect(result.data.max_members).toBe(8);
        expectTypeOf(result.data).toEqualTypeOf<
          z.infer<typeof StudyGroupDTOSchema>
        >();
      }
    });

    it("transforms StudyGroup DTO to domain with snake_case to camelCase mapping", () => {
      const dtoResult = StudyGroupDTOSchema.safeParse(validStudyGroupDto);

      if (dtoResult.success) {
        const transformed = snakeToCamel(dtoResult.data);
        expect(transformed.maxMembers).toBe(8);
        expect(transformed.memberCount).toBe(5);
        expect(transformed.createdBy).toBe(validStudyGroupDto.created_by);
      }
    });
  });

  describe("StudyGroupMemberSchema", () => {
    it("accepts a valid StudyGroupMember payload", () => {
      const result = StudyGroupMemberSchema.safeParse(validStudyGroupMember);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("admin");
        expect(result.data.user.email).toBe(validUser.email);
        expectTypeOf(result.data).toEqualTypeOf<
          z.infer<typeof StudyGroupMemberSchema>
        >();
      }
    });

    it("validates member role enum", () => {
      const validRoles = ["admin", "miembro"];
      validRoles.forEach((role) => {
        const result = StudyGroupMemberSchema.safeParse({
          ...validStudyGroupMember,
          role: role as any,
        });
        expect(result.success).toBe(true);
      });

      const invalidRole = StudyGroupMemberSchema.safeParse({
        ...validStudyGroupMember,
        role: "owner" as any,
      });
      expect(invalidRole.success).toBe(false);
    });
  });

  describe("StudyGroupMemberDTOSchema", () => {
    it("accepts a valid StudyGroupMember DTO payload", () => {
      const result = StudyGroupMemberDTOSchema.safeParse(
        validStudyGroupMemberDto
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("admin");
        expectTypeOf(result.data).toEqualTypeOf<
          z.infer<typeof StudyGroupMemberDTOSchema>
        >();
      }
    });

    it("transforms StudyGroupMember DTO with snake_case to camelCase mapping", () => {
      const dtoResult = StudyGroupMemberDTOSchema.safeParse(
        validStudyGroupMemberDto
      );

      if (dtoResult.success) {
        const transformed = snakeToCamel(dtoResult.data);
        expect(transformed.groupId).toBe(validStudyGroupMemberDto.group_id);
        expect(transformed.userId).toBe(validStudyGroupMemberDto.user_id);
        expect(transformed.joinedAt).toBe(validStudyGroupMemberDto.joined_at);
      }
    });
  });

  describe("StudyApplicationSchema", () => {
    it("accepts a valid StudyApplication payload", () => {
      const result = StudyApplicationSchema.safeParse(validStudyApplication);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe(validStudyApplication.message);
        expect(result.data.status).toBe("pendiente");
        expect(result.data.user.email).toBe(validUser.email);
        expectTypeOf(result.data).toEqualTypeOf<
          z.infer<typeof StudyApplicationSchema>
        >();
      }
    });

    it("rejects StudyApplication with empty message", () => {
      const emptyMessage = StudyApplicationSchema.safeParse({
        ...validStudyApplication,
        message: "",
      });

      expect(emptyMessage.success).toBe(false);
    });

    it("validates application status enum", () => {
      const validStatuses = ["pendiente", "aprobada", "rechazada"];
      validStatuses.forEach((status) => {
        const result = StudyApplicationSchema.safeParse({
          ...validStudyApplication,
          status: status as any,
        });
        expect(result.success).toBe(true);
      });

      const invalidStatus = StudyApplicationSchema.safeParse({
        ...validStudyApplication,
        status: "cancelada" as any,
      });
      expect(invalidStatus.success).toBe(false);
    });
  });

  describe("StudyApplicationDTOSchema", () => {
    it("accepts a valid StudyApplication DTO payload", () => {
      const result = StudyApplicationDTOSchema.safeParse(
        validStudyApplicationDto
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe(validStudyApplicationDto.message);
        expectTypeOf(result.data).toEqualTypeOf<
          z.infer<typeof StudyApplicationDTOSchema>
        >();
      }
    });

    it("transforms StudyApplication DTO with snake_case to camelCase mapping", () => {
      const dtoResult = StudyApplicationDTOSchema.safeParse(
        validStudyApplicationDto
      );

      if (dtoResult.success) {
        const transformed = snakeToCamel(dtoResult.data);
        expect(transformed.groupId).toBe(validStudyApplicationDto.group_id);
        expect(transformed.userId).toBe(validStudyApplicationDto.user_id);
        expect(transformed.createdAt).toBe(validStudyApplicationDto.created_at);
      }
    });
  });
});
