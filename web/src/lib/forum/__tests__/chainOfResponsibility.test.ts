import { describe, it, expect, vi } from "vitest";
import { EnrollmentValidator, ContentValidator, ForumValidatorFactory } from "../chainOfResponsibility";

describe("EnrollmentValidator", () => {
  it("should reject when subjectId is missing", async () => {
    const isEnrolled = vi.fn();
    const validator = new EnrollmentValidator(isEnrolled);
    const result = await validator.validate({});
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("asignatura");
    expect(isEnrolled).not.toHaveBeenCalled();
  });

  it("should reject when user is not enrolled", async () => {
    const isEnrolled = vi.fn().mockResolvedValue(false);
    const validator = new EnrollmentValidator(isEnrolled);
    const result = await validator.validate({ subjectId: "abc-123" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("matriculado");
    expect(isEnrolled).toHaveBeenCalledWith("abc-123");
  });

  it("should pass when user is enrolled", async () => {
    const isEnrolled = vi.fn().mockResolvedValue(true);
    const validator = new EnrollmentValidator(isEnrolled);
    const result = await validator.validate({ subjectId: "abc-123" });
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe("ContentValidator", () => {
  const validator = new ContentValidator();

  it("should reject when title is empty", async () => {
    const result = await validator.validate({ title: "", body: "body" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("título");
  });

  it("should reject when title is missing", async () => {
    const result = await validator.validate({ body: "body" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("título");
  });

  it("should reject when title exceeds 200 chars", async () => {
    const result = await validator.validate({ title: "x".repeat(201), body: "body" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("200");
  });

  it("should reject when body is empty", async () => {
    const result = await validator.validate({ title: "title", body: "" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("contenido");
  });

  it("should reject when body is missing", async () => {
    const result = await validator.validate({ title: "title" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("contenido");
  });

  it("should reject when body exceeds 5000 chars", async () => {
    const result = await validator.validate({ title: "title", body: "x".repeat(5001) });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("5000");
  });

  it("should reject forbidden words in body", async () => {
    const result = await validator.validate({ title: "title", body: "Esto es spam promocional" });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("no permitidas");
  });

  it("should pass with valid title and body", async () => {
    const result = await validator.validate({ title: "¿Cómo resolver X?", body: "He intentado de todo pero no funciona." });
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe("ForumValidatorFactory", () => {
  it("should create chain that validates enrollment then content", async () => {
    const isEnrolled = vi.fn().mockResolvedValue(true);
    const validator = ForumValidatorFactory.createQuestionChain(isEnrolled);

    const result = await validator.validate({
      subjectId: "sub-1",
      title: "Título válido",
      body: "Cuerpo válido",
    });

    expect(result.isValid).toBe(true);
    expect(isEnrolled).toHaveBeenCalledWith("sub-1");
  });

  it("should stop at enrollment failure", async () => {
    const isEnrolled = vi.fn().mockResolvedValue(false);
    const validator = ForumValidatorFactory.createQuestionChain(isEnrolled);

    const result = await validator.validate({
      subjectId: "sub-1",
      title: "Título válido",
      body: "Cuerpo válido",
    });

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("matriculado");
  });
});
