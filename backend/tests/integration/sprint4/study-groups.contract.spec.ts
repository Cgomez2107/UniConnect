import { describe, it, expect } from "vitest";
import { CreateGroupContract } from "@uniconnect/shared-types/contracts/study-group";
import { StudyGroupSchema, StudyGroupDTOSchema, StudyApplicationDTOSchema } from "@uniconnect/shared-types/schemas/study-group";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("Sprint 4 — Sesiones / Study Groups — Contract Validation", () => {
  it("POST /api/v1/study-groups — request body válido pasa CreateGroupContract.request", () => {
    const payload = {
      body: {
        name: "Grupo de Cálculo",
        description: "Estudio semanal de cálculo integral",
        subjectId: UUID,
        maxMembers: 5,
      },
    };
    const result = CreateGroupContract.request.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("POST /api/v1/study-groups — request sin name es rechazado", () => {
    const payload = { body: { description: "Grupo sin nombre", subjectId: UUID, maxMembers: 5 } };
    const result = CreateGroupContract.request.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("POST /api/v1/study-groups — maxMembers negativo es rechazado", () => {
    const payload = { body: { name: "Grupo", description: "Test", subjectId: UUID, maxMembers: -1 } };
    const result = CreateGroupContract.request.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("POST /api/v1/study-groups — response shape válido pasa CreateGroupContract.response", () => {
    const fakeResponse = {
      group: {
        id: UUID,
        name: "Grupo de Álgebra",
        description: "Estudio de álgebra lineal",
        subject: { id: UUID, name: "Álgebra", programId: UUID, code: "MAT101" },
        subjectId: UUID,
        status: "activa",
        maxMembers: 5,
        createdBy: UUID,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    };
    const result = CreateGroupContract.response.safeParse(fakeResponse);
    expect(result.success).toBe(true);
  });

  it("StudyGroupDTOSchema — valida group DTO con snake_case", () => {
    const dto = {
      id: UUID,
      name: "Grupo de Física",
      description: "Física mecánica",
      subject_id: UUID,
      status: "activa",
      max_members: 4,
      created_by: UUID,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const result = StudyGroupDTOSchema.safeParse(dto);
    expect(result.success).toBe(true);
  });

  it("StudyApplicationDTOSchema — valida application DTO", () => {
    const dto = {
      id: UUID,
      group_id: UUID,
      user_id: UUID,
      user: { id: UUID, email: "test@ucaldas.edu.co", first_name: "Test", last_name: "User", role: "estudiante", is_verified: true, created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" },
      message: "Quiero unirme al grupo",
      status: "pendiente",
      created_at: "2026-01-01T00:00:00.000Z",
    };
    const result = StudyApplicationDTOSchema.safeParse(dto);
    expect(result.success).toBe(true);
  });
});
