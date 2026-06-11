import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import { createEventsServer } from "../../src/app/createEventsServer.js";
import { EventsController } from "../../src/interfaces/http/controllers/EventsController.js";

vi.mock("../../src/interfaces/http/middlewares/isAdminUser.js", () => ({
  isAdminUser: vi.fn(),
}));

import { isAdminUser } from "../../src/interfaces/http/middlewares/isAdminUser.js";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const USER_ID = "550e8400-e29b-41d4-a716-446655440001";

type UseCaseStub = { execute: ReturnType<typeof vi.fn> };

function buildExplorationServer() {
  const mockPool = { query: vi.fn() } as never;

  const sampleEvent = {
    id: UUID,
    title: "Seminario de Redes",
    description: "Charla sobre redes neuronales",
    location: "Auditorio Central",
    startAt: "2026-06-15T14:00:00.000Z",
    endAt: "2026-06-15T14:00:00.000Z",
    organizerId: USER_ID,
    organizerName: "Dr. García",
    category: "academico",
    categoryId: "a1b2c3d4-e29b-41d4-a716-446655440000",
    imageUrl: undefined,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "published",
    maxCapacity: 100,
    registeredCount: 0,
    deletedAt: null,
    isFull: false,
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
  const unregisterFromEvent: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(undefined),
  };

  return {
    mockPool,
    sampleEvent,
    getUpcomingEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    publishEvent,
    cancelEvent,
    finishEvent,
    registerForEvent,
    unregisterFromEvent,
  };
}

function buildController(
  stubs: ReturnType<typeof buildExplorationServer>,
  listEventsMock: UseCaseStub,
) {
  return new EventsController(
    stubs.mockPool as never,
    { execute: vi.fn() } as never,
    listEventsMock as never,
    stubs.getUpcomingEvents as never,
    stubs.getEventById as never,
    stubs.createEvent as never,
    stubs.updateEvent as never,
    stubs.deleteEvent as never,
    stubs.publishEvent as never,
    stubs.cancelEvent as never,
    stubs.finishEvent as never,
    stubs.registerForEvent as never,
    stubs.unregisterFromEvent as never,
  );
}

describe("US-EV05 — Exploración de Eventos con Filtros Avanzados", () => {
  beforeAll(() => {
    process.env.NODE_ENV = "test";
  });

  describe("Criterio 1: Paginación y Orden", () => {
    it("C1a: usa page=1 y limit=10 por defecto", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [stubs.sampleEvent],
          total: 25,
          page: 1,
          limit: 10,
          totalPages: 3,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      const response = await request(server as any)
        .get("/api/v1/events")
        .expect(200);

      expect(listEvents.execute).toHaveBeenCalledTimes(1);

      const filterArg = listEvents.execute.mock.calls[0][0];
      expect(filterArg.page).toBe(1);
      expect(filterArg.limit).toBe(10);

      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("meta");
      expect(response.body.meta.total).toBe(25);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
      expect(response.body.meta.totalPages).toBe(3);
    });

    it("C1b: respeta page y limit explícitos", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [stubs.sampleEvent],
          total: 25,
          page: 2,
          limit: 5,
          totalPages: 5,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      const response = await request(server as any)
        .get("/api/v1/events?page=2&limit=5")
        .expect(200);

      const filterArg = listEvents.execute.mock.calls[0][0];
      expect(filterArg.page).toBe(2);
      expect(filterArg.limit).toBe(5);
      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.limit).toBe(5);
      expect(response.body.meta.totalPages).toBe(5);
    });

    it("C1c: response incluye totalItems, totalPages, currentPage en meta", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      const response = await request(server as any)
        .get("/api/v1/events")
        .expect(200);

      expect(response.body.meta).toEqual({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe("Criterio 2: Filtros por Categoría", () => {
    it("C2a: filtra por categorías separadas por coma", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [stubs.sampleEvent],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      await request(server as any)
        .get("/api/v1/events?categories=deportes,academico")
        .expect(200);

      const filterArg = listEvents.execute.mock.calls[0][0];
      expect(filterArg.categories).toEqual(["deportes", "academico"]);
    });

    it("C2b: categoría única sin coma funciona", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [stubs.sampleEvent],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      await request(server as any)
        .get("/api/v1/events?categories=cultural")
        .expect(200);

      const filterArg = listEvents.execute.mock.calls[0][0];
      expect(filterArg.categories).toEqual(["cultural"]);
    });

    it("C2c: categorías vacío no se envía como filtro", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [stubs.sampleEvent],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      await request(server as any)
        .get("/api/v1/events?categories=")
        .expect(200);

      const filterArg = listEvents.execute.mock.calls[0][0];
      expect(filterArg.categories).toBeUndefined();
    });
  });

  describe("Criterio 2: Filtros por Rango de Fechas", () => {
    it("C2d: filtra por startDate", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [stubs.sampleEvent],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      await request(server as any)
        .get("/api/v1/events?startDate=2026-06-01T00:00:00.000Z")
        .expect(200);

      const filterArg = listEvents.execute.mock.calls[0][0];
      expect(filterArg.startDate).toBe("2026-06-01T00:00:00.000Z");
    });

    it("C2e: filtra por endDate", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [stubs.sampleEvent],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      await request(server as any)
        .get("/api/v1/events?endDate=2026-07-01T23:59:59.000Z")
        .expect(200);

      const filterArg = listEvents.execute.mock.calls[0][0];
      expect(filterArg.endDate).toBe("2026-07-01T23:59:59.000Z");
    });

    it("C2f: filtra por startDate + endDate simultáneamente", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [stubs.sampleEvent],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      await request(server as any)
        .get("/api/v1/events?startDate=2026-06-01T00:00:00.000Z&endDate=2026-07-01T23:59:59.000Z")
        .expect(200);

      const filterArg = listEvents.execute.mock.calls[0][0];
      expect(filterArg.startDate).toBe("2026-06-01T00:00:00.000Z");
      expect(filterArg.endDate).toBe("2026-07-01T23:59:59.000Z");
    });
  });

  describe("Criterio 3: Buscador de Texto", () => {
    it("C3a: search se pasa correctamente al use case", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [stubs.sampleEvent],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      await request(server as any)
        .get("/api/v1/events?search=uniconnect")
        .expect(200);

      const filterArg = listEvents.execute.mock.calls[0][0];
      expect(filterArg.search).toBe("uniconnect");
    });

    it("C3b: search vacío no se envía como filtro", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [stubs.sampleEvent],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      await request(server as any)
        .get("/api/v1/events?search=")
        .expect(200);

      const filterArg = listEvents.execute.mock.calls[0][0];
      expect(filterArg.search).toBeUndefined();
    });
  });

  describe("Criterio 4: Lógica de Disponibilidad (isFull)", () => {
    it("C4a: evento con registeredCount >= maxCapacity tiene isFull=true", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const fullEvent = { ...stubs.sampleEvent, maxCapacity: 50, registeredCount: 50, isFull: true };

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [fullEvent],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      const response = await request(server as any)
        .get("/api/v1/events")
        .expect(200);

      expect(response.body.data[0].isFull).toBe(true);
      expect(response.body.data[0].maxCapacity).toBe(50);
      expect(response.body.data[0].registeredCount).toBe(50);
    });

    it("C4b: evento con registeredCount < maxCapacity tiene isFull=false", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const availableEvent = { ...stubs.sampleEvent, maxCapacity: 100, registeredCount: 25, isFull: false };

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [availableEvent],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      const response = await request(server as any)
        .get("/api/v1/events")
        .expect(200);

      expect(response.body.data[0].isFull).toBe(false);
    });

    it("C4c: evento con maxCapacity=null tiene isFull=false (cupo ilimitado)", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const unlimitedEvent = { ...stubs.sampleEvent, maxCapacity: null, registeredCount: 999, isFull: false };

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [unlimitedEvent],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      const response = await request(server as any)
        .get("/api/v1/events")
        .expect(200);

      expect(response.body.data[0].isFull).toBe(false);
      expect(response.body.data[0].maxCapacity).toBeNull();
    });

    it("C4d: evento con registeredCount=0 tiene isFull=false", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const emptyEvent = { ...stubs.sampleEvent, maxCapacity: 100, registeredCount: 0, isFull: false };

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [emptyEvent],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      const response = await request(server as any)
        .get("/api/v1/events")
        .expect(200);

      expect(response.body.data[0].isFull).toBe(false);
    });
  });

  describe("Criterio 2+3: Combinación de filtros múltiples", () => {
    it("combina categories + search + startDate simultáneamente", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [stubs.sampleEvent],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      await request(server as any)
        .get("/api/v1/events?categories=academico,cultural&search=redes&startDate=2026-06-01T00:00:00.000Z")
        .expect(200);

      const filterArg = listEvents.execute.mock.calls[0][0];
      expect(filterArg.categories).toEqual(["academico", "cultural"]);
      expect(filterArg.search).toBe("redes");
      expect(filterArg.startDate).toBe("2026-06-01T00:00:00.000Z");
      expect(filterArg.page).toBe(1);
      expect(filterArg.limit).toBe(10);
    });

    it("combina page + limit + endDate", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [],
          total: 0,
          page: 3,
          limit: 20,
          totalPages: 0,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      await request(server as any)
        .get("/api/v1/events?page=3&limit=20&endDate=2026-12-31T23:59:59.000Z")
        .expect(200);

      const filterArg = listEvents.execute.mock.calls[0][0];
      expect(filterArg.page).toBe(3);
      expect(filterArg.limit).toBe(20);
      expect(filterArg.endDate).toBe("2026-12-31T23:59:59.000Z");
    });
  });

  describe("Filtros existentes (compatibilidad)", () => {
    it("upcoming=true sigue funcionando", async () => {
      vi.mocked(isAdminUser).mockResolvedValue(false);
      const stubs = buildExplorationServer();

      const listEvents: UseCaseStub = {
        execute: vi.fn().mockResolvedValue({
          data: [stubs.sampleEvent],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      };

      const server = createEventsServer(buildController(stubs, listEvents));

      const response = await request(server as any)
        .get("/api/v1/events?upcoming=true")
        .expect(200);

      expect(stubs.getUpcomingEvents.execute).toHaveBeenCalled();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
