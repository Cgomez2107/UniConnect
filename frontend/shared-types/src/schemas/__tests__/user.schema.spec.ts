import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  FacultyDTOSchema,
  FacultySchema,
  ProfileDTOSchema,
  ProfileSchema,
  ProgramDTOSchema,
  ProgramSchema,
  SubjectDTOSchema,
  SubjectSchema,
  UserProgramDTOSchema,
  UserProgramSchema,
  UserSubjectDTOSchema,
  UserSubjectSchema,
} from "../user.schema";
import { snakeToCamel } from "../../lib/mappers";

const validProfile = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "student@ucaldas.edu.co",
  firstName: "Ana",
  lastName: "Gomez",
  role: "estudiante" as const,
  profileImageUrl: "https://example.com/avatar.png",
  isVerified: true,
  createdAt: "2026-05-14T12:00:00.000Z",
  updatedAt: "2026-05-14T12:00:00.000Z",
  bio: "Estudiante de ingeniería.",
  phone: "+573001112233",
  institution: "Universidad de Caldas",
  faculty: "Ingeniería",
  program: "Ingeniería de Sistemas",
  subjects: ["Matemáticas I", "Programación I"],
};

const validProfileDto = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "student@ucaldas.edu.co",
  first_name: "Ana",
  last_name: "Gomez",
  role: "estudiante" as const,
  profile_image_url: "https://example.com/avatar.png",
  is_verified: true,
  created_at: "2026-05-14T12:00:00.000Z",
  updated_at: "2026-05-14T12:00:00.000Z",
  bio: "Estudiante de ingeniería.",
  phone: "+573001112233",
  institution: "Universidad de Caldas",
  faculty: "Ingeniería",
  program: "Ingeniería de Sistemas",
  subjects: ["Matemáticas I", "Programación I"],
};

const validFaculty = {
  id: "550e8400-e29b-41d4-a716-446655440111",
  name: "Ingeniería",
  description: "Facultad de ingeniería y tecnología.",
  code: "ING",
};

const validFacultyDto = {
  id: "550e8400-e29b-41d4-a716-446655440111",
  name: "Ingeniería",
  description: "Facultad de ingeniería y tecnología.",
  code: "ING",
};

const validProgram = {
  id: "550e8400-e29b-41d4-a716-446655440222",
  name: "Ingeniería de Sistemas",
  facultyId: "550e8400-e29b-41d4-a716-446655440111",
  description: "Programa de pregrado.",
  code: "ISW",
};

const validProgramDto = {
  id: "550e8400-e29b-41d4-a716-446655440222",
  name: "Ingeniería de Sistemas",
  faculty_id: "550e8400-e29b-41d4-a716-446655440111",
  description: "Programa de pregrado.",
  code: "ISW",
};

const validSubject = {
  id: "550e8400-e29b-41d4-a716-446655440333",
  name: "Programación I",
  programId: "550e8400-e29b-41d4-a716-446655440222",
  code: "PROG1",
  description: "Introducción a programación.",
  credits: 4,
};

const validSubjectDto = {
  id: "550e8400-e29b-41d4-a716-446655440333",
  name: "Programación I",
  program_id: "550e8400-e29b-41d4-a716-446655440222",
  code: "PROG1",
  description: "Introducción a programación.",
  credits: 4,
};

const validUserSubjectDto = {
  id: "550e8400-e29b-41d4-a716-446655440444",
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  subject_id: "550e8400-e29b-41d4-a716-446655440333",
  subject: validSubjectDto,
  enrolled_at: "2026-05-14T12:00:00.000Z",
};

const validUserProgramDto = {
  id: "550e8400-e29b-41d4-a716-446655440555",
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  program_id: "550e8400-e29b-41d4-a716-446655440222",
  program: validProgramDto,
  enrolled_at: "2026-05-14T12:00:00.000Z",
};

describe("user.schema", () => {
  it("accepts a valid Profile schema payload", () => {
    const result = ProfileSchema.safeParse(validProfile);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subjects).toHaveLength(2);
      expectTypeOf(result.data).toEqualTypeOf<z.infer<typeof ProfileSchema>>();
    }
  });

  it("rejects malformed Profile payloads", () => {
    const invalidUuid = ProfileSchema.safeParse({
      ...validProfile,
      id: "bad-id",
    });
    const emptyRequiredName = ProfileSchema.safeParse({
      ...validProfile,
      firstName: "",
    });

    expect(invalidUuid.success).toBe(false);
    expect(emptyRequiredName.success).toBe(false);
  });

  it("accepts a valid Profile DTO and transforms snake_case to camelCase", () => {
    const dtoResult = ProfileDTOSchema.safeParse(validProfileDto);

    expect(dtoResult.success).toBe(true);
    if (dtoResult.success) {
      const camel = snakeToCamel(dtoResult.data);

      expect(camel.firstName).toBe(validProfile.firstName);
      expect(camel.lastName).toBe(validProfile.lastName);
      expect(camel.profileImageUrl).toBe(validProfile.profileImageUrl);
      expect(camel.createdAt).toBe(validProfile.createdAt);
      expect(camel.updatedAt).toBe(validProfile.updatedAt);
      expectTypeOf(camel.firstName).toEqualTypeOf<z.infer<typeof ProfileSchema>["firstName"]>();
      expectTypeOf(camel.lastName).toEqualTypeOf<z.infer<typeof ProfileSchema>["lastName"]>();
      expectTypeOf(camel.createdAt).toEqualTypeOf<z.infer<typeof ProfileSchema>["createdAt"]>();
      expectTypeOf(dtoResult.data).toEqualTypeOf<z.infer<typeof ProfileDTOSchema>>();
    }
  });

  it("accepts and rejects Faculty schema payloads as expected", () => {
    const validResult = FacultySchema.safeParse(validFaculty);
    const validDtoResult = FacultyDTOSchema.safeParse(validFacultyDto);
    const invalidResult = FacultySchema.safeParse({
      ...validFaculty,
      code: "",
    });

    expect(validResult.success).toBe(true);
    expect(validDtoResult.success).toBe(true);
    expect(invalidResult.success).toBe(false);

    if (validResult.success) {
      expectTypeOf(validResult.data).toEqualTypeOf<z.infer<typeof FacultySchema>>();
    }

    if (validDtoResult.success) {
      expectTypeOf(validDtoResult.data).toEqualTypeOf<z.infer<typeof FacultyDTOSchema>>();
    }
  });

  it("accepts Program and Subject schemas and DTO transformations", () => {
    const programResult = ProgramSchema.safeParse(validProgram);
    const subjectResult = SubjectSchema.safeParse(validSubject);
    const programDtoResult = ProgramDTOSchema.safeParse(validProgramDto);
    const subjectDtoResult = SubjectDTOSchema.safeParse(validSubjectDto);

    expect(programResult.success).toBe(true);
    expect(subjectResult.success).toBe(true);
    expect(programDtoResult.success).toBe(true);
    expect(subjectDtoResult.success).toBe(true);

    if (programResult.success && subjectResult.success && programDtoResult.success && subjectDtoResult.success) {
      const programCamel = snakeToCamel(programDtoResult.data);
      const subjectCamel = snakeToCamel(subjectDtoResult.data);

      expect(programCamel.facultyId).toBe(validProgram.facultyId);
      expect(subjectCamel.programId).toBe(validSubject.programId);
      expectTypeOf(programResult.data).toEqualTypeOf<z.infer<typeof ProgramSchema>>();
      expectTypeOf(subjectResult.data).toEqualTypeOf<z.infer<typeof SubjectSchema>>();
      expectTypeOf(programCamel.facultyId).toEqualTypeOf<z.infer<typeof ProgramSchema>["facultyId"]>();
      expectTypeOf(subjectCamel.programId).toEqualTypeOf<z.infer<typeof SubjectSchema>["programId"]>();
      expectTypeOf(programDtoResult.data).toEqualTypeOf<z.infer<typeof ProgramDTOSchema>>();
      expectTypeOf(subjectDtoResult.data).toEqualTypeOf<z.infer<typeof SubjectDTOSchema>>();
    }
  });

  it("accepts UserSubject and UserProgram DTOs and preserves nested shape", () => {
    const userSubjectResult = UserSubjectDTOSchema.safeParse(validUserSubjectDto);
    const userProgramResult = UserProgramDTOSchema.safeParse(validUserProgramDto);

    expect(userSubjectResult.success).toBe(true);
    expect(userProgramResult.success).toBe(true);

    if (userSubjectResult.success && userProgramResult.success) {
      const userSubjectCamel = snakeToCamel(userSubjectResult.data);
      const userProgramCamel = snakeToCamel(userProgramResult.data);
      const nestedSubject = snakeToCamel(userSubjectResult.data.subject);
      const nestedProgram = snakeToCamel(userProgramResult.data.program);

      expect(userSubjectCamel.userId).toBe(validUserSubjectDto.user_id);
      expect(userSubjectCamel.subjectId).toBe(validUserSubjectDto.subject_id);
      expect(userSubjectCamel.enrolledAt).toBe(validUserSubjectDto.enrolled_at);
      expect(userProgramCamel.programId).toBe(validUserProgramDto.program_id);
      expect(userProgramCamel.enrolledAt).toBe(validUserProgramDto.enrolled_at);

      expectTypeOf(userSubjectResult.data).toEqualTypeOf<z.infer<typeof UserSubjectDTOSchema>>();
      expectTypeOf(userProgramResult.data).toEqualTypeOf<z.infer<typeof UserProgramDTOSchema>>();
      expectTypeOf(userSubjectCamel.userId).toEqualTypeOf<z.infer<typeof UserSubjectSchema>["userId"]>();
      expectTypeOf(userSubjectCamel.subjectId).toEqualTypeOf<z.infer<typeof UserSubjectSchema>["subjectId"]>();
      expectTypeOf(userSubjectCamel.enrolledAt).toEqualTypeOf<z.infer<typeof UserSubjectSchema>["enrolledAt"]>();
      expectTypeOf(userProgramCamel.userId).toEqualTypeOf<z.infer<typeof UserProgramSchema>["userId"]>();
      expectTypeOf(userProgramCamel.programId).toEqualTypeOf<z.infer<typeof UserProgramSchema>["programId"]>();
      expectTypeOf(userProgramCamel.enrolledAt).toEqualTypeOf<z.infer<typeof UserProgramSchema>["enrolledAt"]>();
      expectTypeOf(nestedSubject).toEqualTypeOf<z.infer<typeof SubjectSchema>>();
      expectTypeOf(nestedProgram).toEqualTypeOf<z.infer<typeof ProgramSchema>>();
    }
  });
});
