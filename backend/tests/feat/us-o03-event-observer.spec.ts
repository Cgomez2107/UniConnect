import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";
import { describe, it } from "node:test";

import { CreateEvent } from "../../services/events/src/application/use-cases/CreateEvent.js";
import { InMemorySubscriptionRepository } from "../../services/events/src/domain/events/subscriptions/InMemorySubscriptionRepository.js";
import { UniversityEventObserver, type IEventSocketGateway } from "../../services/events/src/domain/events/UniversityEventObserver.js";
import { UniversityEventSubject } from "../../services/events/src/domain/events/UniversityEventSubject.js";
import { SubscriptionController } from "../../services/events/src/interfaces/http/controllers/SubscriptionController.js";
import { handleEventsRoutes } from "../../services/events/src/interfaces/http/routes/eventsRoutes.js";

type MockResponse = ServerResponse & {
  statusCode: number;
  body: string;
  headers: Record<string, string>;
};

function buildBearerToken(userId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64");
  return `${header}.${payload}.signature`;
}

function createJsonRequest(params: {
  method: string;
  url: string;
  body?: unknown;
  userId?: string;
}): IncomingMessage {
  const req = new EventEmitter() as IncomingMessage;

  req.method = params.method;
  req.url = params.url;
  req.headers = {};

  if (params.userId) {
    req.headers.authorization = `Bearer ${buildBearerToken(params.userId)}`;
  }

  queueMicrotask(() => {
    if (params.body !== undefined) {
      req.emit("data", Buffer.from(JSON.stringify(params.body), "utf-8"));
    }
    req.emit("end");
  });

  return req;
}

function createMockResponse(): MockResponse {
  let statusCode = 200;
  let body = "";
  let headers: Record<string, string> = {};

  return {
    writeHead(code: number, hdrs: Record<string, string>) {
      statusCode = code;
      headers = hdrs;
      return this;
    },
    end(payload?: string) {
      if (payload) body += payload;
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
    get headers() {
      return headers;
    },
  } as unknown as MockResponse;
}

describe("US-O03 - Observer de eventos universitarios", () => {
  it("AC-02: expone endpoints POST/DELETE /api/v1/eventos/suscribir", async () => {
    let subscribeCalled = false;
    let unsubscribeCalled = false;

    const reqPost = { method: "POST", url: "/api/v1/eventos/suscribir" } as IncomingMessage;
    const reqDelete = { method: "DELETE", url: "/api/v1/eventos/suscribir" } as IncomingMessage;
    const resPost = createMockResponse();
    const resDelete = createMockResponse();

    const handledPost = await handleEventsRoutes(
      reqPost,
      resPost,
      {} as any,
      {
          subscribe: async () => {
              subscribeCalled = true;
          },
          unsubscribe: async () => {
              unsubscribeCalled = true;
          },
      } as unknown as SubscriptionController,
    );

    const handledDelete = await handleEventsRoutes(
      reqDelete,
      resDelete,
      {} as any,
      {
          subscribe: async () => {
              subscribeCalled = true;
          },
          unsubscribe: async () => {
              unsubscribeCalled = true;
          },
      } as unknown as SubscriptionController,
    );

    assert.equal(handledPost, true);
    assert.equal(handledDelete, true);
    assert.equal(subscribeCalled, true);
    assert.equal(unsubscribeCalled, true);
  });

  it("AC-02 borde: desuscribirse de una categoría no suscrita no rompe y responde 200", async () => {
    const repo = new InMemorySubscriptionRepository();
    const controller = new SubscriptionController(repo);

    const req = createJsonRequest({
      method: "DELETE",
      url: "/api/v1/eventos/suscribir",
      userId: "user_1",
      body: { categoria: "academico" },
    });
    const res = createMockResponse();

    await controller.unsubscribe(req, res);

    assert.equal(res.statusCode, 200);
    const response = JSON.parse(res.body);
    assert.equal(response.data.success, true);

    const userSubscriptions = await repo.getUserSubscriptions("user_1");
    assert.deepEqual(userSubscriptions, []);
  });

  it("AC-01/03/04: flujo completo Suscripción -> Publicación -> Recepción selectiva", async () => {
    const subscriptionRepo = new InMemorySubscriptionRepository();
    const emitted: Array<{ userId: string; event: string; payload: Record<string, unknown> }> = [];

    const socketGateway: IEventSocketGateway = {
      emitToUser: async (userId, event, payload) => {
        emitted.push({ userId, event, payload });
      },
    };

    const observer = new UniversityEventObserver(subscriptionRepo, socketGateway);
    const subject = new UniversityEventSubject();
    subject.subscribe(observer);

    await subscriptionRepo.subscribe("user_acad_1", "academico");
    await subscriptionRepo.subscribe("user_acad_2", "academico");
    await subscriptionRepo.subscribe("user_deporte_1", "deportivo");

    const mockEventRepository = {
      create: async (input: any) => ({
        id: "evt-001",
        title: input.title,
        description: input.description,
        location: input.location,
        startAt: input.startAt,
        endAt: input.startAt,
        organizerId: input.organizerId,
        organizerName: "Organizador",
        category: input.category,
        imageUrl: input.imageUrl,
        createdAt: "2026-05-10T14:30:00.000Z",
        updatedAt: "2026-05-10T14:30:00.000Z",
      }),
      getAllEvents: async () => [],
      getUpcomingEvents: async () => [],
      getById: async () => null,
      update: async () => {
        throw new Error("not implemented");
      },
      delete: async () => {},
      updateStatus: async () => {},
    };

    const createEvent = new CreateEvent(mockEventRepository as any, subject);

    await createEvent.execute({
      actorUserId: "admin_1",
      title: "Conferencia de IA",
      description: "Evento academico",
      location: "Auditorio",
      startAt: "2026-06-20T10:00:00.000Z",
      category: "academico",
    });

    const notifiedUsers = emitted.map(x => x.userId).sort();
    assert.deepEqual(notifiedUsers, ["user_acad_1", "user_acad_2"]);

    for (const message of emitted) {
      assert.equal(message.event, "NUEVO_EVENTO");
      assert.equal(message.payload.category, "academico");
      assert.equal(typeof message.payload.eventId, "string");
    }

    assert.equal(notifiedUsers.includes("user_deporte_1"), false);
  });

  it("AC-03 borde: si no hay suscriptores para la categoría, no emite WebSocket", async () => {
    const subscriptionRepo = new InMemorySubscriptionRepository();
    const emitted: Array<{ userId: string; event: string }> = [];

    const socketGateway: IEventSocketGateway = {
      emitToUser: async (userId, event) => {
        emitted.push({ userId, event });
      },
    };

    const observer = new UniversityEventObserver(subscriptionRepo, socketGateway);
    const subject = new UniversityEventSubject();
    subject.subscribe(observer);

    await subscriptionRepo.subscribe("user_deporte", "deportivo");

    await subject.emit({
      type: "NUEVO_EVENTO",
      version: "1.0",
      timestamp: new Date("2026-05-10T14:30:00.000Z"),
      eventId: "evt-002",
      title: "Seminario académico",
      category: "academico",
      message: "Nuevo evento académico",
      payload: {
        eventId: "evt-002",
        title: "Seminario académico",
        description: "Sin suscriptores académicos",
        category: "academico",
        location: "Aula 1",
        startAt: "2026-06-21T10:00:00.000Z",
        organizerId: "admin_2",
      },
    });

    assert.equal(emitted.length, 0);
  });

  it("AC-01 borde: crear un evento sin categoría falla con ValidationError", async () => {
    const mockEventRepository = {
      create: async (input: any) => ({
        id: "evt-003",
        title: input.title,
        description: input.description,
        location: input.location,
        startAt: input.startAt,
        endAt: input.startAt,
        organizerId: input.organizerId,
        category: input.category,
        createdAt: "2026-05-10T14:30:00.000Z",
        updatedAt: "2026-05-10T14:30:00.000Z",
      }),
    };

    const createEvent = new CreateEvent(mockEventRepository as any, new UniversityEventSubject());

    await assert.rejects(
      () => createEvent.execute({
        actorUserId: "admin_1",
        title: "Evento sin categoría",
        description: "Debe fallar",
        location: "Auditorio",
        startAt: "2026-06-20T10:00:00.000Z",
        category: undefined as never,
      }),
      error => error instanceof Error && error.name === "ValidationError" && error.message === "La categoría es obligatoria.",
    );
  });
});
