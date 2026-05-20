import { describe, it, expect } from "vitest";
import { z } from "zod";

const ForumQuestionSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  body: z.string().min(1),
  subjectId: z.string(),
  userId: z.string(),
  createdAt: z.string(),
  answerCount: z.number().int().nonnegative().optional(),
  isSolved: z.boolean().optional(),
});

const ForumAnswerSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  body: z.string().min(1),
  userId: z.string(),
  createdAt: z.string(),
  isSolution: z.boolean().optional(),
  voteCount: z.number().int().optional(),
});

describe("Sprint 4 — Foro / Academic Q&A — Contract Validation", () => {
  it("POST /api/v1/forum/questions — create question response shape", () => {
    const mockResponse = {
      id: "550e8400-e29b-41d4-a716-446655440030",
      title: "¿Cómo resolver integrales dobles?",
      body: "Tengo dudas sobre integrales dobles en cálculo vectorial",
      subjectId: "550e8400-e29b-41d4-a716-446655440031",
      userId: "550e8400-e29b-41d4-a716-446655440032",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const result = ForumQuestionSchema.safeParse(mockResponse);
    expect(result.success).toBe(true);
  });

  it("GET /api/v1/forum/questions — list questions response shape", () => {
    const mockListResponse = [
      {
        id: "550e8400-e29b-41d4-a716-446655440033",
        title: "Duda sobre física cuántica",
        body: "Explicación del principio de incertidumbre",
        subjectId: "550e8400-e29b-41d4-a716-446655440034",
        userId: "550e8400-e29b-41d4-a716-446655440035",
        createdAt: "2026-01-01T00:00:00.000Z",
        answerCount: 3,
        isSolved: false,
      },
    ];
    mockListResponse.forEach((q) => {
      const result = ForumQuestionSchema.safeParse(q);
      expect(result.success).toBe(true);
    });
  });

  it("POST /api/v1/forum/questions/:id/answers — create answer response shape", () => {
    const mockAnswer = {
      id: "550e8400-e29b-41d4-a716-446655440036",
      questionId: "550e8400-e29b-41d4-a716-446655440033",
      body: "La respuesta es usar el teorema de Green",
      userId: "550e8400-e29b-41d4-a716-446655440037",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const result = ForumAnswerSchema.safeParse(mockAnswer);
    expect(result.success).toBe(true);
  });

  it("POST /api/v1/forum/questions — request sin title es rechazado", () => {
    const invalidBody = { body: "Contenido sin título", subjectId: "some-uuid" };
    const schema = z.object({ title: z.string().min(1), body: z.string().min(1), subjectId: z.string() });
    const result = schema.safeParse(invalidBody);
    expect(result.success).toBe(false);
  });
});
