import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import { createEventsServer } from "../../src/app/createEventsServer.js";
import { EventsController } from "../../src/interfaces/http/controllers/EventsController.js";
import { AuthorizationError } from "../../../../shared/libs/errors/AuthorizationError.js";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const USER_ID = "550e8400-e29b-41d4-a716-446655440001";
const NON_OWNER_ID = "550e8400-e29b-41d4-a716-446655440099";

type UseCaseStub = { execute: ReturnType<typeof vi.fn> };

function buildEventsServer() {
  const mockPool = { query: vi.fn() } as never;

  const baseEvent = {
    id: UUID,
    title: "Seminario de Redes",
    description: "Charla sobre redes",
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
    isFull: false,
  };

  const getAllEvents: UseCaseStub = {
    execute: vi.fn().mockResolvedValue({
      data: [baseEvent],
      total: 1, page: 1, limit: 20, totalPages: 1,
    }),
  };
  const listEvents: UseCaseStub = {
    execute: vi.fn().mockResolvedValue({
      data: [baseEvent],
      total: 1, page: 1, limit: 10, totalPages: 1,
    }),
  };
  const getUpcomingEvents: UseCaseStub = {
    execute: vi.fn().mockResolvedValue([baseEvent]),
  };
  const getEventById: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(baseEvent),
  };
  const createEvent: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(baseEvent),
  };
  const deleteEvent: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(undefined),
  };
  const registerForEvent: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(undefined),
  };
  const unregisterFromEvent: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(undefined),
  };

  function authGuardStub(input: { actorUserId: string; isAdmin?: boolean }): boolean {
    if (input.actorUserId !== USER_ID && !input.isAdmin) return false;
    return true;
  }

  const updateEvent: UseCaseStub = {
    execute: vi.fn().mockImplementation(async (input: { actorUserId: string; isAdmin?: boolean }) => {
      if (!authGuardStub(input)) {
        throw new AuthorizationError("Solo el organizador o un administrador pueden editar este evento.");
      }
      return baseEvent;
    }),
  };
  const publishEvent: UseCaseStub = {
    execute: vi.fn().mockImplementation(async (input: { actorUserId: string; isAdmin?: boolean }) => {
      if (!authGuardStub(input)) {
        throw new AuthorizationError("Solo el organizador o un administrador pueden publicar el evento.");
      }
      return baseEvent;
    }),
  };
  const cancelEvent: UseCaseStub = {
    execute: vi.fn().mockImplementation(async (input: { actorUserId: string; isAdmin?: boolean }) => {
      if (!authGuardStub(input)) {
        throw new AuthorizationError("Solo el organizador o un administrador pueden cancelar el evento.");
      }
      return baseEvent;
    }),
  };
  const finishEvent: UseCaseStub = {
    execute: vi.fn().mockImplementation(async (input: { actorUserId: string; isAdmin?: boolean }) => {
      if (!authGuardStub(input)) {
        throw new AuthorizationError("Solo el organizador o un administrador pueden finalizar el evento.");
      }
      return baseEvent;
    }),
  };

  const controller = new EventsController(
    mockPool,
    getAllEvents as never,
    listEvents as never,
    getUpcomingEvents as never,
    getEventById as never,
    createEvent as never,
    updateEvent as never,
    deleteEvent as never,
    publishEvent as never,
    cancelEvent as never,
    finishEvent as never,
    registerForEvent as never,
    unregisterFromEvent as never,
  );

  return { server: createEventsServer(controller), deleteEvent, updateEvent, publishEvent, cancelEvent, finishEvent };
}

describe("US-EV01 — Admin Guard Integration (Bl 4+5)", () => {
  beforeAll(() => {
    process.env.NODE_ENV = "test";
  });

  describe("DELETE /api/v1/events/:id — admin-only gate", () => {
    it("C1: retorna 403 con mensaje exacto cuando x-user-role NO es admin", async () => {
      const { server, deleteEvent } = buildEventsServer();

      const res = await request(server as any)
        .delete(`/api/v1/events/${UUID}`)
        .set("x-user-id", USER_ID)
        .set("x-user-role", "estudiante")
        .expect(403);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toBe("Acceso restringido a super_admin");
      expect(deleteEvent.execute).not.toHaveBeenCalled();
    });

    it("C2: retorna 403 con mensaje exacto cuando NO hay x-user-role", async () => {
      const { server, deleteEvent } = buildEventsServer();

      const res = await request(server as any)
        .delete(`/api/v1/events/${UUID}`)
        .set("x-user-id", USER_ID)
        .expect(403);

      expect(res.body.error).toBe("Acceso restringido a super_admin");
      expect(deleteEvent.execute).not.toHaveBeenCalled();
    });

    it("C3: retorna 200 y ejecuta el use case cuando x-user-role es admin", async () => {
      const { server, deleteEvent } = buildEventsServer();

      await request(server as any)
        .delete(`/api/v1/events/${UUID}`)
        .set("x-user-id", USER_ID)
        .set("x-user-role", "admin")
        .expect(200);

      expect(deleteEvent.execute).toHaveBeenCalledTimes(1);
    });

    it("C4: retorna 200 y ejecuta el use case cuando x-user-role es super_admin", async () => {
      const { server, deleteEvent } = buildEventsServer();

      await request(server as any)
        .delete(`/api/v1/events/${UUID}`)
        .set("x-user-id", USER_ID)
        .set("x-user-role", "super_admin")
        .expect(200);

      expect(deleteEvent.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/v1/events — list (soft admin check)", () => {
    it("C5: retorna 200 (no 403) cuando x-user-role es estudiante — el listado se filtra, no se bloquea", async () => {
      const { server } = buildEventsServer();

      const res = await request(server as any)
        .get("/api/v1/events")
        .set("x-user-id", USER_ID)
        .set("x-user-role", "estudiante")
        .expect(200);

      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("C6: retorna 200 (no 403) cuando falta x-user-role — listado público filtrado", async () => {
      const { server } = buildEventsServer();

      const res = await request(server as any)
        .get("/api/v1/events")
        .set("x-user-id", USER_ID)
        .expect(200);

      expect(res.body).toHaveProperty("data");
    });
  });

  describe("PUT /api/v1/events/:id — update", () => {
    it("C7: retorna 200 cuando x-user-role es admin (aunque no sea owner)", async () => {
      const { server, updateEvent } = buildEventsServer();

      await request(server as any)
        .put(`/api/v1/events/${UUID}`)
        .set("Content-Type", "application/json")
        .set("x-user-id", NON_OWNER_ID)
        .set("x-user-role", "admin")
        .send({ title: "Admin edit" })
        .expect(200);

      expect(updateEvent.execute).toHaveBeenCalled();
    });

    it("C7b: retorna 403 cuando no es admin ni owner", async () => {
      const { server, updateEvent } = buildEventsServer();

      const res = await request(server as any)
        .put(`/api/v1/events/${UUID}`)
        .set("Content-Type", "application/json")
        .set("x-user-id", NON_OWNER_ID)
        .set("x-user-role", "estudiante")
        .send({ title: "Hack" })
        .expect(403);

      expect(res.body.error).toBe("Solo el organizador o un administrador pueden editar este evento.");
      expect(updateEvent.execute).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/events/:id/publish — lifecycle action", () => {
    it("C8: retorna 200 cuando x-user-role es admin", async () => {
      const { server, publishEvent } = buildEventsServer();

      await request(server as any)
        .post(`/api/v1/events/${UUID}/publish`)
        .set("x-user-id", USER_ID)
        .set("x-user-role", "admin")
        .expect(200);

      expect(publishEvent.execute).toHaveBeenCalled();
    });

    it("C8b: retorna 403 cuando no es admin ni owner", async () => {
      const { server, publishEvent } = buildEventsServer();

      const res = await request(server as any)
        .post(`/api/v1/events/${UUID}/publish`)
        .set("x-user-id", NON_OWNER_ID)
        .set("x-user-role", "estudiante")
        .expect(403);

      expect(res.body.error).toBe("Solo el organizador o un administrador pueden publicar el evento.");
      expect(publishEvent.execute).toHaveBeenCalled();
    });

    it("C8c: retorna 200 cuando es owner (no admin)", async () => {
      const { server, publishEvent } = buildEventsServer();

      await request(server as any)
        .post(`/api/v1/events/${UUID}/publish`)
        .set("x-user-id", USER_ID)
        .set("x-user-role", "estudiante")
        .expect(200);

      expect(publishEvent.execute).toHaveBeenCalled();
    });

    it("C9: retorna 401 sin x-user-id", async () => {
      const { server } = buildEventsServer();

      await request(server as any)
        .post(`/api/v1/events/${UUID}/publish`)
        .expect(401);
    });
  });

  describe("POST /api/v1/events/:id/cancel — cancel", () => {
    it("C11: retorna 200 cuando x-user-role es admin", async () => {
      const { server, cancelEvent } = buildEventsServer();

      await request(server as any)
        .post(`/api/v1/events/${UUID}/cancel`)
        .set("x-user-id", NON_OWNER_ID)
        .set("x-user-role", "admin")
        .expect(200);

      expect(cancelEvent.execute).toHaveBeenCalled();
    });

    it("C11b: retorna 403 cuando no es admin ni owner", async () => {
      const { server, cancelEvent } = buildEventsServer();

      const res = await request(server as any)
        .post(`/api/v1/events/${UUID}/cancel`)
        .set("x-user-id", NON_OWNER_ID)
        .set("x-user-role", "estudiante")
        .expect(403);

      expect(res.body.error).toBe("Solo el organizador o un administrador pueden cancelar el evento.");
      expect(cancelEvent.execute).toHaveBeenCalled();
    });

    it("C11c: retorna 200 cuando es owner (no admin)", async () => {
      const { server, cancelEvent } = buildEventsServer();

      await request(server as any)
        .post(`/api/v1/events/${UUID}/cancel`)
        .set("x-user-id", USER_ID)
        .set("x-user-role", "estudiante")
        .expect(200);

      expect(cancelEvent.execute).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/events/:id/finish — finish", () => {
    it("C12: retorna 200 cuando x-user-role es admin", async () => {
      const { server, finishEvent } = buildEventsServer();

      await request(server as any)
        .post(`/api/v1/events/${UUID}/finish`)
        .set("x-user-id", NON_OWNER_ID)
        .set("x-user-role", "admin")
        .expect(200);

      expect(finishEvent.execute).toHaveBeenCalled();
    });

    it("C12b: retorna 403 cuando no es admin ni owner", async () => {
      const { server, finishEvent } = buildEventsServer();

      const res = await request(server as any)
        .post(`/api/v1/events/${UUID}/finish`)
        .set("x-user-id", NON_OWNER_ID)
        .set("x-user-role", "estudiante")
        .expect(403);

      expect(res.body.error).toBe("Solo el organizador o un administrador pueden finalizar el evento.");
      expect(finishEvent.execute).toHaveBeenCalled();
    });

    it("C12c: retorna 200 cuando es owner (no admin)", async () => {
      const { server, finishEvent } = buildEventsServer();

      await request(server as any)
        .post(`/api/v1/events/${UUID}/finish`)
        .set("x-user-id", USER_ID)
        .set("x-user-role", "estudiante")
        .expect(200);

      expect(finishEvent.execute).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/v1/admin/events/:id — strict admin-only route", () => {
    it("ADM-DEL-C1: retorna 403 cuando x-user-role es estudiante", async () => {
      const { server, deleteEvent } = buildEventsServer();

      const res = await request(server as any)
        .delete(`/api/v1/admin/events/${UUID}`)
        .set("x-user-id", USER_ID)
        .set("x-user-role", "estudiante")
        .expect(403);

      expect(res.body.error).toBe("Acceso restringido a super_admin");
      expect(deleteEvent.execute).not.toHaveBeenCalled();
    });

    it("ADM-DEL-C2: retorna 403 cuando NO hay x-user-role", async () => {
      const { server, deleteEvent } = buildEventsServer();

      const res = await request(server as any)
        .delete(`/api/v1/admin/events/${UUID}`)
        .set("x-user-id", USER_ID)
        .expect(403);

      expect(res.body.error).toBe("Acceso restringido a super_admin");
      expect(deleteEvent.execute).not.toHaveBeenCalled();
    });

    it("ADM-DEL-C3: retorna 200 cuando x-user-role es admin (zero DB query via header)", async () => {
      const { server, deleteEvent } = buildEventsServer();

      await request(server as any)
        .delete(`/api/v1/admin/events/${UUID}`)
        .set("x-user-id", USER_ID)
        .set("x-user-role", "admin")
        .expect(200);

      expect(deleteEvent.execute).toHaveBeenCalledTimes(1);
    });

    it("ADM-DEL-C4: retorna 200 cuando x-user-role es super_admin", async () => {
      const { server, deleteEvent } = buildEventsServer();

      await request(server as any)
        .delete(`/api/v1/admin/events/${UUID}`)
        .set("x-user-id", USER_ID)
        .set("x-user-role", "super_admin")
        .expect(200);

      expect(deleteEvent.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /api/v1/admin/events/:id/publish — strict admin route", () => {
    it("ADM-PUB-C1: retorna 403 para estudiante", async () => {
      const { server, publishEvent } = buildEventsServer();

      const res = await request(server as any)
        .post(`/api/v1/admin/events/${UUID}/publish`)
        .set("x-user-id", USER_ID)
        .set("x-user-role", "estudiante")
        .expect(403);

      expect(res.body.error).toBe("Acceso restringido a super_admin");
      expect(publishEvent.execute).not.toHaveBeenCalled();
    });

    it("ADM-PUB-C2: retorna 200 para admin", async () => {
      const { server, publishEvent } = buildEventsServer();

      await request(server as any)
        .post(`/api/v1/admin/events/${UUID}/publish`)
        .set("x-user-id", USER_ID)
        .set("x-user-role", "admin")
        .expect(200);

      expect(publishEvent.execute).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/admin/events/:id/cancel — strict admin route", () => {
    it("ADM-CAN-C1: retorna 403 para estudiante", async () => {
      const { server, cancelEvent } = buildEventsServer();

      const res = await request(server as any)
        .post(`/api/v1/admin/events/${UUID}/cancel`)
        .set("x-user-id", USER_ID)
        .set("x-user-role", "estudiante")
        .expect(403);

      expect(res.body.error).toBe("Acceso restringido a super_admin");
      expect(cancelEvent.execute).not.toHaveBeenCalled();
    });

    it("ADM-CAN-C2: retorna 200 para admin", async () => {
      const { server, cancelEvent } = buildEventsServer();

      await request(server as any)
        .post(`/api/v1/admin/events/${UUID}/cancel`)
        .set("x-user-id", USER_ID)
        .set("x-user-role", "admin")
        .expect(200);

      expect(cancelEvent.execute).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/admin/events/:id/finish — strict admin route", () => {
    it("ADM-FIN-C1: retorna 403 para estudiante", async () => {
      const { server, finishEvent } = buildEventsServer();

      const res = await request(server as any)
        .post(`/api/v1/admin/events/${UUID}/finish`)
        .set("x-user-id", USER_ID)
        .set("x-user-role", "estudiante")
        .expect(403);

      expect(res.body.error).toBe("Acceso restringido a super_admin");
      expect(finishEvent.execute).not.toHaveBeenCalled();
    });

    it("ADM-FIN-C2: retorna 200 para admin", async () => {
      const { server, finishEvent } = buildEventsServer();

      await request(server as any)
        .post(`/api/v1/admin/events/${UUID}/finish`)
        .set("x-user-id", USER_ID)
        .set("x-user-role", "admin")
        .expect(200);

      expect(finishEvent.execute).toHaveBeenCalled();
    });
  });

  describe("Sin autenticación", () => {
    it("C10: retorna 401 para DELETE sin x-user-id", async () => {
      const { server } = buildEventsServer();

      await request(server as any)
        .delete(`/api/v1/events/${UUID}`)
        .expect(401);
    });
  });
});
