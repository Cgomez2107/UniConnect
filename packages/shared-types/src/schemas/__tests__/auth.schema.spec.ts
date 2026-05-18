import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  AuthProfileDTOSchema,
  AuthProfileSchema,
  UserDTOSchema,
  UserSchema,
} from "../auth.schema.js";
import { snakeToCamel } from "../../lib/mappers.js";

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

describe("auth.schema", () => {
  it("accepts a valid User schema payload", () => {
    const result = UserSchema.safeParse(validUser);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe(validUser.email);
      expectTypeOf(result.data).toEqualTypeOf<z.infer<typeof UserSchema>>();
    }
  });

  it("rejects malformed User payloads", () => {
    const invalidEmail = UserSchema.safeParse({
      ...validUser,
      email: "not-an-email",
    });
    const emptyName = UserSchema.safeParse({
      ...validUser,
      firstName: "",
    });

    expect(invalidEmail.success).toBe(false);
    expect(emptyName.success).toBe(false);
  });

  it("accepts a valid AuthProfile schema payload", () => {
    const result = AuthProfileSchema.safeParse({
      ...validUser,
      isOnboarded: true,
      lastLoginAt: "2026-05-14T12:00:00.000Z",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isOnboarded).toBe(true);
      expectTypeOf(result.data).toEqualTypeOf<z.infer<typeof AuthProfileSchema>>();
    }
  });

  it("rejects malformed AuthProfile payloads", () => {
    const missingRequiredFlag = AuthProfileSchema.safeParse({
      ...validUser,
      lastLoginAt: "2026-05-14T12:00:00.000Z",
    });
    const badTimestamp = AuthProfileSchema.safeParse({
      ...validUser,
      isOnboarded: true,
      lastLoginAt: "not-a-date",
    });

    expect(missingRequiredFlag.success).toBe(false);
    expect(badTimestamp.success).toBe(false);
  });

  it("validates snake_case DTO schemas and transforms to camelCase via mapper", () => {
    const dtoResult = UserDTOSchema.safeParse(validUserDto);

    expect(dtoResult.success).toBe(true);
    if (dtoResult.success) {
      const camel = snakeToCamel(dtoResult.data);

      expect(camel.firstName).toBe(validUser.firstName);
      expect(camel.lastName).toBe(validUser.lastName);
      expect(camel.profileImageUrl).toBe(validUser.profileImageUrl);
      expectTypeOf(camel).toEqualTypeOf<z.infer<typeof UserSchema>>();
      expectTypeOf(dtoResult.data).toEqualTypeOf<z.infer<typeof UserDTOSchema>>();
    }
  });

  it("validates AuthProfile DTO schemas and preserves DTO shape", () => {
    const dtoResult = AuthProfileDTOSchema.safeParse({
      ...validUserDto,
      is_onboarded: true,
      last_login_at: "2026-05-14T12:00:00.000Z",
    });

    expect(dtoResult.success).toBe(true);
    if (dtoResult.success) {
      expect(dtoResult.data.is_onboarded).toBe(true);
      expectTypeOf(dtoResult.data).toEqualTypeOf<z.infer<typeof AuthProfileDTOSchema>>();
    }
  });
});
