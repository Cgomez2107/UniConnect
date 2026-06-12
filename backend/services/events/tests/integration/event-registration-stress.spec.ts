import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createEventsServer } from "../../src/app/createEventsServer.js";
import { EventsController } from "../../src/interfaces/http/controllers/EventsController.js";
import { RegisterForEvent } from "../../src/application/use-cases/RegisterForEvent.js";
import { UnregisterFromEvent } from "../../src/application/use-cases/UnregisterFromEvent.js";
import type { IEventRepository } from "../../src/domain/repositories/IEventRepository.js";
import type { Event, PaginatedResult, ListEventsFilter } from "../../src/domain/entities/Event.js";
import type { EventStatus } from "../../src/domain/state/EventStatus.js";
import {
  ConflictError,
  ValidationError,
} from "../../../../shared/libs/errors/index.js";

vi.mock("../../src/interfaces/http/middlewares/isAdminUser.js", () => ({
  isAdminUser: vi.fn(),
}));

// ============================================================================
// InMemoryEventRepository — Repositorio fake con mutex para simular
// el bloqueo pesimista (FOR UPDATE) de la base de datos.
// ============================================================================

class InMemoryEventRepository implements IEventRepository {
  private events: Map<string, Event> = new Map();
  private eventRegistrations: Map<string, Set<string>> = new Map();
  private usersEmail: Map<string, string> = new Map();
  private locked = false;
  private lockQueue: Array<() => void> = [];

  private async acquireLock(): Promise<() => void> {
    while (this.locked) {
      await new Promise<void>((resolve) => this.lockQueue.push(resolve));
    }
    this.locked = true;
    let released = false;
    return () => {
      if (!released) {
        this.locked = false;
        released = true;
        const next = this.lockQueue.shift();
        if (next) next();
      }
    };
  }

  addEvent(event: Event): void {
    this.events.set(event.id, { ...event });
  }

  setUserEmail(userId: string, email: string): void {
    this.usersEmail.set(userId, email);
  }

  async registerForEvent(eventId: string, userId: string): Promise<void> {
    const release = await this.acquireLock();
    try {
      const event = this.events.get(eventId);
      if (!event) throw new Error("Event not found");
      if (event.status !== "published")
        throw new ValidationError("Event is not open for registration");

      const regs = this.eventRegistrations.get(eventId) ?? new Set();
      if (regs.has(userId))
        throw new ConflictError("Ya estás inscrito a este evento");
      if (event.maxCapacity !== null && regs.size >= event.maxCapacity)
        throw new ConflictError("Cupo agotado");

      regs.add(userId);
      this.eventRegistrations.set(eventId, regs);
    } finally {
      release();
    }
  }

  async unregisterFromEvent(eventId: string, userId: string): Promise<void> {
    const release = await this.acquireLock();
    try {
      const regs = this.eventRegistrations.get(eventId);
      if (!regs || !regs.has(userId))
        throw new ValidationError("No estás registrado en este evento");
      regs.delete(userId);
      if (regs.size === 0) this.eventRegistrations.delete(eventId);
    } finally {
      release();
    }
  }

  async getById(id: string): Promise<Event | null> {
    return this.events.get(id) ?? null;
  }

  async getRegisteredUsers(eventId: string): Promise<string[]> {
    return Array.from(this.eventRegistrations.get(eventId) ?? []);
  }

  async getUserEmail(userId: string): Promise<string | null> {
    return this.usersEmail.get(userId) ?? null;
  }

  async list(_filter?: ListEventsFilter): Promise<PaginatedResult<Event>> {
    const data = Array.from(this.events.values());
    return { data, total: data.length, page: 1, limit: 10, totalPages: 1 };
  }

  async getUpcomingEvents(_limit?: number): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async create(_input: Record<string, unknown>): Promise<Event> {
    throw new Error("Not implemented");
  }

  async update(
    _id: string,
    _organizerId: string,
    _input: Record<string, unknown>,
  ): Promise<Event> {
    throw new Error("Not implemented");
  }

  async updateStatus(_id: string, _status: EventStatus): Promise<void> {
    throw new Error("Not implemented");
  }

  async softDelete(_id: string): Promise<void> {
    throw new Error("Not implemented");
  }
}

// ============================================================================
// Helpers
// ============================================================================

const EVENT_ID = "550e8400-e29b-41d4-a716-446655440000";
const BASE_TIME = new Date("2026-06-15T14:00:00.000Z").getTime();

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: EVENT_ID,
    title: "Seminario de Redes",
    description: "Charla sobre redes neuronales",
    location: "Auditorio Central",
    startAt: new Date(BASE_TIME).toISOString(),
    endAt: new Date(BASE_TIME).toISOString(),
    organizerId: "organizer-1",
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
    ...overrides,
  };
}

function userEventId(index: number): string {
  return `550e8400-e29b-41d4-a716-${String(index).padStart(12, "0")}`;
}

// ============================================================================
// TESTS: Stress de concurrencia — Criterio 2
// ============================================================================

describe("US-EV06 — Criterio 2: Stress de concurrencia (último cupo)", () => {
  let repo: InMemoryEventRepository;
  let registerUseCase: RegisterForEvent;

  beforeEach(() => {
    repo = new InMemoryEventRepository();
    registerUseCase = new RegisterForEvent(repo);
  });

  it("maxCapacity=1: solo 1 de 10 solicitudes simultáneas debe triunfar", async () => {
    repo.addEvent(makeEvent({ maxCapacity: 1 }));

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, (_, i) =>
        registerUseCase.execute({
          eventId: EVENT_ID,
          userId: userEventId(i + 1),
        }),
      ),
    );

    const fulfilled = results.filter(
      (r) => r.status === "fulfilled",
    ).length;
    const rejected = results.filter(
      (r) => r.status === "rejected",
    );

    expect(fulfilled).toBe(1);
    expect(rejected.length).toBe(9);
    for (const r of rejected) {
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(ConflictError);
      expect((r as PromiseRejectedResult).reason.message).toBe("Cupo agotado");
    }
  });

  it("maxCapacity=3: solo 3 de 5 solicitudes simultáneas triunfan", async () => {
    repo.addEvent(makeEvent({ maxCapacity: 3 }));

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, (_, i) =>
        registerUseCase.execute({
          eventId: EVENT_ID,
          userId: userEventId(i + 1),
        }),
      ),
    );

    const fulfilled = results.filter(
      (r) => r.status === "fulfilled",
    ).length;
    const rejected = results.filter(
      (r) => r.status === "rejected",
    );

    expect(fulfilled).toBe(3);
    expect(rejected.length).toBe(2);
    for (const r of rejected) {
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(ConflictError);
      expect((r as PromiseRejectedResult).reason.message).toBe("Cupo agotado");
    }
  });

  it("maxCapacity=null: todas las solicitudes triunfan (cupo ilimitado)", async () => {
    repo.addEvent(makeEvent({ maxCapacity: null }));

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, (_, i) =>
        registerUseCase.execute({
          eventId: EVENT_ID,
          userId: userEventId(i + 1),
        }),
      ),
    );

    const fulfilled = results.filter(
      (r) => r.status === "fulfilled",
    ).length;
    expect(fulfilled).toBe(10);
  });

  it("registro duplicado del mismo usuario rechazado con ConflictError", async () => {
    repo.addEvent(makeEvent({ maxCapacity: 5 }));

    await registerUseCase.execute({
      eventId: EVENT_ID,
      userId: userEventId(1),
    });

    await expect(
      registerUseCase.execute({
        eventId: EVENT_ID,
        userId: userEventId(1),
      }),
    ).rejects.toThrow(ConflictError);
    await expect(
      registerUseCase.execute({
        eventId: EVENT_ID,
        userId: userEventId(1),
      }),
    ).rejects.toThrow("Ya estás inscrito a este evento");
  });

  it("registro a evento no publicado es rechazado", async () => {
    repo.addEvent(makeEvent({ status: "draft" }));

    await expect(
      registerUseCase.execute({
        eventId: EVENT_ID,
        userId: userEventId(1),
      }),
    ).rejects.toThrow(ValidationError);
  });
});

// ============================================================================
// TESTS: Validación de ventana de cancelación 24h — Criterios 3 y 4
// ============================================================================

describe("US-EV06 — Criterios 3 y 4: Cancelación y ventana de 24h", () => {
  let repo: InMemoryEventRepository;
  let unregisterUseCase: UnregisterFromEvent;

  beforeEach(() => {
    repo = new InMemoryEventRepository();
    unregisterUseCase = new UnregisterFromEvent(repo);
  });

  it("Criterio 3: cancelar 48h antes del evento → éxito", async () => {
    const future = Date.now() + 48 * 60 * 60 * 1000;
    repo.addEvent(
      makeEvent({ startAt: new Date(future).toISOString(), maxCapacity: 5 }),
    );
    await repo.registerForEvent(EVENT_ID, userEventId(1));

    await expect(
      unregisterUseCase.execute({
        eventId: EVENT_ID,
        userId: userEventId(1),
      }),
    ).resolves.toBeUndefined();
  });

  it("Criterio 4: cancelar 12h antes del evento → ValidationError con mensaje de política", async () => {
    const soon = Date.now() + 12 * 60 * 60 * 1000;
    repo.addEvent(
      makeEvent({ startAt: new Date(soon).toISOString(), maxCapacity: 5 }),
    );
    await repo.registerForEvent(EVENT_ID, userEventId(1));

    await expect(
      unregisterUseCase.execute({
        eventId: EVENT_ID,
        userId: userEventId(1),
      }),
    ).rejects.toThrow(ValidationError);

    await expect(
      unregisterUseCase.execute({
        eventId: EVENT_ID,
        userId: userEventId(1),
      }),
    ).rejects.toThrow(
      "Política de cancelación: No se permiten cancelaciones a menos de 24 horas del evento. Contacta al organizador directamente.",
    );
  });

  it("Criterio 3: cancelar exactamente 24h + 1min antes → éxito (boundary superior)", async () => {
    const slightlyAbove24h = Date.now() + 24 * 60 * 60 * 1000 + 60 * 1000;
    repo.addEvent(
      makeEvent({
        startAt: new Date(slightlyAbove24h).toISOString(),
        maxCapacity: 5,
      }),
    );
    await repo.registerForEvent(EVENT_ID, userEventId(1));

    await expect(
      unregisterUseCase.execute({
        eventId: EVENT_ID,
        userId: userEventId(1),
      }),
    ).resolves.toBeUndefined();
  });

  it("Criterio 4: cancelar 23h59m antes → ValidationError (boundary inferior)", async () => {
    const almost24h = Date.now() + 23 * 60 * 60 * 1000 + 59 * 60 * 1000;
    repo.addEvent(
      makeEvent({
        startAt: new Date(almost24h).toISOString(),
        maxCapacity: 5,
      }),
    );
    await repo.registerForEvent(EVENT_ID, userEventId(1));

    await expect(
      unregisterUseCase.execute({
        eventId: EVENT_ID,
        userId: userEventId(1),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("cancelar sin estar registrado → error", async () => {
    repo.addEvent(makeEvent({ maxCapacity: 5 }));

    await expect(
      unregisterUseCase.execute({
        eventId: EVENT_ID,
        userId: userEventId(1),
      }),
    ).rejects.toThrow(ValidationError);

    await expect(
      unregisterUseCase.execute({
        eventId: EVENT_ID,
        userId: userEventId(1),
      }),
    ).rejects.toThrow("No estás registrado en este evento");
  });
});

// ============================================================================
// TESTS: Integración HTTP — Criterios 1, 2, 3 y 4
// ============================================================================

describe("US-EV06 — Integración HTTP", () => {
  const USER_ID = "550e8400-e29b-41d4-a716-446655440001";
  const UUID = "550e8400-e29b-41d4-a716-446655440000";

  type UseCaseStub = { execute: ReturnType<typeof vi.fn> };

  function buildServer(stubs: {
    registerForEvent?: UseCaseStub;
    unregisterFromEvent?: UseCaseStub;
    getEventById?: UseCaseStub;
  }) {
    const mockPool = { query: vi.fn() } as never;

    const getEventById: UseCaseStub = stubs.getEventById ?? {
      execute: vi.fn().mockResolvedValue({
        id: UUID,
        title: "Evento de prueba",
        status: "published",
        startAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        maxCapacity: 10,
        registeredCount: 0,
        isFull: false,
      }),
    };

    const registerForEvent: UseCaseStub = stubs.registerForEvent ?? {
      execute: vi.fn().mockResolvedValue(undefined),
    };

    const unregisterFromEvent: UseCaseStub = stubs.unregisterFromEvent ?? {
      execute: vi.fn().mockResolvedValue(undefined),
    };

    const controller = new EventsController(
      mockPool,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      getEventById as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      registerForEvent as never,
      unregisterFromEvent as never,
    );

    return {
      server: createEventsServer(controller),
      registerForEvent,
      unregisterFromEvent,
    };
  }

  describe("POST /api/v1/events/:id/register", () => {
    it("Criterio 1: registro exitoso → 200 con mensaje", async () => {
      const { server, registerForEvent } = buildServer({});

      const res = await request(server as any)
        .post(`/api/v1/events/${UUID}/register`)
        .set("x-user-id", USER_ID)
        .expect(200);

      expect(res.body.data.message).toBe("Inscripción exitosa");
      expect(registerForEvent.execute).toHaveBeenCalledWith({
        eventId: UUID,
        userId: USER_ID,
      });
    });

    it("Criterio 2: cupo agotado → 409 Conflict", async () => {
      const mockRegister: UseCaseStub = {
        execute: vi.fn().mockRejectedValue(new ConflictError("Cupo agotado")),
      };
      const { server } = buildServer({ registerForEvent: mockRegister });

      const res = await request(server as any)
        .post(`/api/v1/events/${UUID}/register`)
        .set("x-user-id", USER_ID)
        .expect(409);

      expect(res.body.error).toBe("Cupo agotado");
    });

    it("Criterio 2: ya inscrito → 409 Conflict", async () => {
      const mockRegister: UseCaseStub = {
        execute: vi
          .fn()
          .mockRejectedValue(
            new ConflictError("Ya estás inscrito a este evento"),
          ),
      };
      const { server } = buildServer({ registerForEvent: mockRegister });

      const res = await request(server as any)
        .post(`/api/v1/events/${UUID}/register`)
        .set("x-user-id", USER_ID)
        .expect(409);

      expect(res.body.error).toBe("Ya estás inscrito a este evento");
    });

    it("sin autenticación → 401", async () => {
      const { server } = buildServer({});

      await request(server as any)
        .post(`/api/v1/events/${UUID}/register`)
        .expect(401);
    });
  });

  describe("POST /api/v1/events/:id/unregister", () => {
    it("Criterio 3: cancelación exitosa → 200", async () => {
      const { server, unregisterFromEvent } = buildServer({});

      const res = await request(server as any)
        .post(`/api/v1/events/${UUID}/unregister`)
        .set("x-user-id", USER_ID)
        .expect(200);

      expect(res.body.data.message).toBe("Cancelación exitosa");
      expect(unregisterFromEvent.execute).toHaveBeenCalledWith({
        eventId: UUID,
        userId: USER_ID,
      });
    });

    it("Criterio 4: cancelación con <24h → 400 con mensaje de política", async () => {
      const mockUnregister: UseCaseStub = {
        execute: vi
          .fn()
          .mockRejectedValue(
            new ValidationError(
              "Política de cancelación: No se permiten cancelaciones a menos de 24 horas del evento. Contacta al organizador directamente.",
            ),
          ),
      };
      const { server } = buildServer({
        unregisterFromEvent: mockUnregister,
      });

      const res = await request(server as any)
        .post(`/api/v1/events/${UUID}/unregister`)
        .set("x-user-id", USER_ID)
        .expect(400);

      expect(res.body.error).toContain("Política de cancelación");
      expect(res.body.error).toContain("24 horas");
    });

    it("sin autenticación → 401", async () => {
      const { server } = buildServer({});

      await request(server as any)
        .post(`/api/v1/events/${UUID}/unregister`)
        .expect(401);
    });
  });

  describe("Concurrencia simulada vía HTTP", () => {
    it("Criterio 2: 10 requests simultáneas, solo 1 obtiene 200, resto 409", async () => {
      let remainingSpots = 1;
      const mockRegister: UseCaseStub = {
        execute: vi.fn().mockImplementation(async () => {
          if (remainingSpots <= 0)
            throw new ConflictError("Cupo agotado");
          remainingSpots--;
        }),
      };

      const { server } = buildServer({ registerForEvent: mockRegister });

      const results = await Promise.allSettled(
        Array.from({ length: 10 }, (_, i) =>
          request(server as any)
            .post(`/api/v1/events/${UUID}/register`)
            .set("x-user-id", userEventId(i + 1)),
        ),
      );

      const status200 = results.filter(
        (r) =>
          r.status === "fulfilled" && (r.value as any).status === 200,
      ).length;
      const status409 = results.filter(
        (r) =>
          r.status === "fulfilled" && (r.value as any).status === 409,
      ).length;

      expect(status200).toBe(1);
      expect(status409).toBe(9);
      expect(mockRegister.execute).toHaveBeenCalledTimes(10);
    });
  });
});
