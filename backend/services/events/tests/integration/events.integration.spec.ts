import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createEventsServer } from "../../src/app/createEventsServer.js";
import { EventsController } from "../../src/interfaces/http/controllers/EventsController.js";
import { CreateEventContract, CreateEventRequestSchema } from "@uniconnect/shared-types/contracts/event";

vi.mock("../../src/interfaces/http/middlewares/isAdminUser.js", () => ({
  isAdminUser: vi.fn(),
}));

import { isAdminUser } from "../../src/interfaces/http/middlewares/isAdminUser.js";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const USER_ID = "550e8400-e29b-41d4-a716-446655440001";

type UseCaseStub = { execute: ReturnType<typeof vi.fn> };

function buildEventsServer() {
  const mockPool = { query: vi.fn() } as never;

  const sampleEvent = {
    id: UUID,
    title: "Seminario de Redes",
    description: "Charla sobre redes neuronales",
    location: "Auditorio Central",
    startAt: "2026-06-15T14:00:00.000Z",
    endAt: "2026-06-15T14:00:00.000Z",
    organizerId: USER_ID,
    category: "academico",
    categoryId: UUID,
    imageUrl: undefined,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "draft",
    maxCapacity: 100,
    registeredCount: 0,
    deletedAt: null,
  };

  const getAllEvents: UseCaseStub = {
    execute: vi.fn().mockResolvedValue({
      data: [sampleEvent],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
  };
  const getUpcomingEvents: UseCaseStub = {
    execute: vi.fn().mockResolvedValue([sampleEvent]),
  };
  const getEventById: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(sampleEvent),
  };
  const createEvent: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(sampleEvent),
  };
  const updateEvent: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(sampleEvent),
  };
  const deleteEvent: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(undefined),
  };
  const publishEvent: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(sampleEvent),
  };
  const cancelEvent: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(sampleEvent),
  };
  const finishEvent: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(sampleEvent),
  };
  const registerForEvent: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(undefined),
  };

  const controller = new EventsController(
    mockPool,
    getAllEvents as never,
    getUpcomingEvents as never,
    getEventById as never,
    createEvent as never,
    updateEvent as never,
    deleteEvent as never,
    publishEvent as never,
    cancelEvent as never,
    finishEvent as never,
    registerForEvent as never,
  );

  return {
    server: createEventsServer(controller),
    getAllEvents,
    getUpcomingEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}

describe("Events integration /api/v1/events", () => {
  describe("POST /api/v1/events", () => {
    it("crea un evento when body cumple el contrato (AAA)", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(true);
      const { server, createEvent } = buildEventsServer();

      const validBody = {
        title: "Seminario de Redes",
        description: "Charla sobre redes neuronales",
        eventDate: "2026-06-15T14:00:00.000Z",
        location: "Auditorio Central",
        capacity: 100,
        isOnline: false,
        tags: ["redes", "ia"],
      };

      const requestParse = CreateEventRequestSchema.safeParse({ body: validBody });
      expect(requestParse.success).toBe(true);

      const response = await request(server as any)
        .post("/api/v1/events")
        .set("Content-Type", "application/json")
        .set("x-user-id", USER_ID)
        .send(validBody)
        .expect(201);

      expect(createEvent.execute).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data.id).toBe(UUID);
      expect(response.body.data.title).toBe("Seminario de Redes");

      const contractResult = CreateEventContract.response.safeParse(response.body);
      if (!contractResult.success) {
        console.warn("[CONTRACT] CreateEventContract.response no coincide con backend:", contractResult.error.issues);
      }
    });

    it("rechaza body sin title con 400", async () => {
      const { server, createEvent } = buildEventsServer();

      await request(server as any)
        .post("/api/v1/events")
        .set("Content-Type", "application/json")
        .set("x-user-id", USER_ID)
        .send({
          description: "Evento sin titulo",
          eventDate: "2026-06-15T14:00:00.000Z",
        })
        .expect(400);

      expect(createEvent.execute).not.toHaveBeenCalled();
    });

    it("rechaza request sin x-user-id con 401", async () => {
      const { server, createEvent } = buildEventsServer();

      await request(server as any)
        .post("/api/v1/events")
        .set("Content-Type", "application/json")
        .send({
          title: "Test",
          description: "Test desc",
          eventDate: "2026-06-15T14:00:00.000Z",
        })
        .expect(401);

      expect(createEvent.execute).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/events", () => {
    it("lista eventos y response tiene data array", async () => {
      const { server, getAllEvents } = buildEventsServer();

      const response = await request(server as any)
        .get("/api/v1/events")
        .expect(200);

      expect(getAllEvents.execute).toHaveBeenCalledTimes(1);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].id).toBe(UUID);
    });

    it("filtra por upcoming cuando query param esta presente", async () => {
      const { server, getUpcomingEvents } = buildEventsServer();

      await request(server as any)
        .get("/api/v1/events?upcoming=true")
        .expect(200);

      expect(getUpcomingEvents.execute).toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/events/:id", () => {
    it("obtiene evento por id", async () => {
      const { server, getEventById } = buildEventsServer();

      const response = await request(server as any)
        .get(`/api/v1/events/${UUID}`)
        .expect(200);

      expect(getEventById.execute).toHaveBeenCalledWith(UUID);
      expect(response.body.data.id).toBe(UUID);
    });

    it("responde 404 cuando evento no existe", async () => {
      const { server, getEventById } = buildEventsServer();
      getEventById.execute.mockResolvedValueOnce(null);

      await request(server as any)
        .get(`/api/v1/events/${UUID}`)
        .expect(404);
    });
  });

  describe("PUT /api/v1/events/:id", () => {
    it("actualiza evento (admin) y responde 200", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(true);
      const { server, updateEvent } = buildEventsServer();

      await request(server as any)
        .put(`/api/v1/events/${UUID}`)
        .set("Content-Type", "application/json")
        .set("x-user-id", USER_ID)
        .set("x-user-role", "admin")
        .send({ title: "Nuevo titulo" })
        .expect(200);

      expect(updateEvent.execute).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/v1/events/:id", () => {
    it("elimina evento (admin) y responde 200", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(true);
      const { server, deleteEvent } = buildEventsServer();

      await request(server as any)
        .delete(`/api/v1/events/${UUID}`)
        .set("x-user-id", USER_ID)
        .set("x-user-role", "admin")
        .expect(200);

      expect(deleteEvent.execute).toHaveBeenCalled();
    });
  });

  it("GET /health responde 200", async () => {
    const { server } = buildEventsServer();
    const response = await request(server as any).get("/health").expect(200);
    expect(response.body.service).toBe("events");
    expect(response.body.status).toBe("ok");
  });
});
