import { describe, it, expect } from "vitest";
import { CreateEventContract } from "@uniconnect/shared-types/contracts/event";
import { EventSchema, EventDTOSchema } from "@uniconnect/shared-types/schemas/event";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("Sprint 4 — Eventos — Contract Validation", () => {
  it("POST /api/v1/events — request body válido pasa CreateEventContract.request", () => {
    const payload = {
      body: {
        title: "Seminario de Redes",
        description: "Charla sobre redes neuronales",
        eventDate: "2026-06-15T14:00:00.000Z",
        location: "Auditorio Central",
        capacity: 100,
        isOnline: false,
        tags: ["redes", "ia"],
      },
    };
    const result = CreateEventContract.request.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("POST /api/v1/events — request sin title es rechazado", () => {
    const payload = {
      body: {
        description: "Evento sin título",
        eventDate: "2026-06-15T14:00:00.000Z",
      },
    };
    const result = CreateEventContract.request.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("POST /api/v1/events — response shape válido pasa CreateEventContract.response", () => {
    const fakeResponse = {
      event: {
        id: UUID,
        title: "Taller de Machine Learning",
        description: "Taller práctico de ML",
        eventDate: "2026-07-01T10:00:00.000Z",
        location: "Laboratorio de Cómputo",
        creatorId: UUID,
        capacity: 30,
        attendeeCount: 0,
        isOnline: false,
        tags: ["ml", "ia"],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    };
    const result = CreateEventContract.response.safeParse(fakeResponse);
    expect(result.success).toBe(true);
  });

  it("EventDTOSchema — valida event DTO con snake_case", () => {
    const dto = {
      id: UUID,
      title: "Conferencia",
      description: "Conferencia magistral",
      event_date: "2026-08-01T09:00:00.000Z",
      location: "Teatro",
      creator_id: UUID,
      capacity: 200,
      attendee_count: 0,
      is_online: true,
      event_url: "https://zoom.us/j/123",
      tags: ["conferencia"],
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const result = EventDTOSchema.safeParse(dto);
    expect(result.success).toBe(true);
  });

  it("EventSchema — valida event domain completo", () => {
    const domain = {
      id: UUID,
      title: "Hackathon",
      description: "Competencia de programación",
      eventDate: "2026-09-01T08:00:00.000Z",
      location: "Edificio de Ingeniería",
      creatorId: UUID,
      capacity: 50,
      attendeeCount: 0,
      isOnline: false,
      tags: ["hackathon", "programación"],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const result = EventSchema.safeParse(domain);
    expect(result.success).toBe(true);
  });
});
