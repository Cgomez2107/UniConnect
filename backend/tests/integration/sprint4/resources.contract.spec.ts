import { describe, it, expect } from "vitest";
import { CreateResourceContract } from "@uniconnect/shared-types/contracts/resource";
import { StudyResourceSchema, StudyResourceDTOSchema } from "@uniconnect/shared-types/schemas/resource";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("Sprint 4 — Bibliografía / Resources — Contract Validation", () => {
  it("POST /api/v1/resources — request body válido pasa CreateResourceContract.request", () => {
    const payload = {
      body: {
        title: "Algebra Lineal",
        description: "Libro de álgebra para ingeniería",
        url: "https://ejemplo.com/algebra.pdf",
        subjectId: UUID,
        tags: ["matemáticas", "álgebra"],
        isPublic: true,
      },
    };
    const result = CreateResourceContract.request.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("POST /api/v1/resources — request sin title es rechazado", () => {
    const payload = {
      body: {
        url: "https://ejemplo.com/recurso.pdf",
        subjectId: UUID,
      },
    };
    const result = CreateResourceContract.request.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("POST /api/v1/resources — response shape válido pasa CreateResourceContract.response", () => {
    const fakeResponse = {
      resource: {
        id: UUID,
        userId: UUID,
        programId: UUID,
        subjectId: UUID,
        title: "Cálculo Diferencial",
        description: "Libro de cálculo",
        fileUrl: "https://ejemplo.com/calculo.pdf",
        fileName: "calculo.pdf",
        fileType: "pdf",
        fileSizeKb: 1024,
        resourceType: "pdf",
        ogTitle: null,
        ogImage: null,
        ogDescription: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    };
    const result = CreateResourceContract.response.safeParse(fakeResponse);
    expect(result.success).toBe(true);
  });

  it("StudyResourceDTOSchema — valida resource DTO completo", () => {
    const dto = {
      id: UUID,
      user_id: UUID,
      program_id: UUID,
      subject_id: UUID,
      title: "Física General",
      description: null,
      file_url: "https://ejemplo.com/fisica.pdf",
      file_name: "fisica.pdf",
      file_type: "pdf",
      file_size_kb: 2048,
      resource_type: "pdf",
      og_title: null,
      og_image: null,
      og_description: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const result = StudyResourceDTOSchema.safeParse(dto);
    expect(result.success).toBe(true);
  });

  it("StudyResourceSchema — valida resource domain completo", () => {
    const domain = {
      id: UUID,
      userId: UUID,
      programId: UUID,
      subjectId: UUID,
      title: "Química Orgánica",
      description: null,
      fileUrl: "https://ejemplo.com/quimica.pdf",
      fileName: "quimica.pdf",
      fileType: "pdf",
      fileSizeKb: 3072,
      resourceType: "pdf",
      ogTitle: null,
      ogImage: null,
      ogDescription: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const result = StudyResourceSchema.safeParse(domain);
    expect(result.success).toBe(true);
  });
});
