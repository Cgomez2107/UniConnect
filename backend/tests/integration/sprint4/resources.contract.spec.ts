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
        title: "Cálculo Diferencial",
        description: "Libro de cálculo",
        type: "pdf",
        url: "https://ejemplo.com/calculo.pdf",
        uploaderUserId: UUID,
        subjectId: UUID,
        tags: ["matemáticas"],
        viewCount: 0,
        downloadCount: 0,
        isPublic: true,
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
      title: "Física General",
      type: "pdf",
      url: "https://ejemplo.com/fisica.pdf",
      uploader_user_id: UUID,
      subject_id: UUID,
      tags: ["física"],
      view_count: 0,
      download_count: 0,
      is_public: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const result = StudyResourceDTOSchema.safeParse(dto);
    expect(result.success).toBe(true);
  });

  it("StudyResourceSchema — valida resource domain completo", () => {
    const domain = {
      id: UUID,
      title: "Química Orgánica",
      type: "pdf",
      url: "https://ejemplo.com/quimica.pdf",
      uploaderUserId: UUID,
      subjectId: UUID,
      tags: ["química"],
      viewCount: 0,
      downloadCount: 0,
      isPublic: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const result = StudyResourceSchema.safeParse(domain);
    expect(result.success).toBe(true);
  });
});
