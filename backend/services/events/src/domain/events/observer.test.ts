import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { UniversityEventSubject } from "./UniversityEventSubject.js";
import { UniversityEventObserver, type IEventSocketGateway } from "./UniversityEventObserver.js";
import { InMemorySubscriptionRepository } from "./subscriptions/InMemorySubscriptionRepository.js";
import type { UniversityEvent } from "./UniversityEvents.js";

const baseEvent: UniversityEvent = {
  type: "NUEVO_EVENTO",
  version: "1.0",
  timestamp: new Date("2026-05-10T14:30:00.000Z"),
  eventId: "550e8400-e29b-41d4-a716-446655440000",
  title: "Conferencia: IA en la Educación",
  category: "academico",
  message: "Se ha publicado un nuevo evento: Conferencia: IA en la Educación",
  payload: {
    eventId: "550e8400-e29b-41d4-a716-446655440000",
    title: "Conferencia: IA en la Educación",
    description: "Charla sobre el impacto de la IA",
    category: "academico",
    location: "Auditorio Principal",
    startAt: "2026-06-15T10:00:00.000Z",
    organizerId: "user_admin_001",
    organizerName: "Dra. María García",
  },
};

describe("AC-01: UniversityEventSubject emite NUEVO_EVENTO", () => {
  it("debe emitir el evento a todos los observers suscritos", async () => {
    const subject = new UniversityEventSubject();
    let received: UniversityEvent | null = null;

    const mockObserver = {
      name: "MockObserver",
      handle: async (event: UniversityEvent) => { received = event; },
    };

    subject.subscribe(mockObserver);
    await subject.emit(baseEvent);

    assert.notEqual(received, null);
    assert.equal(received!.type, "NUEVO_EVENTO");
    assert.equal(received!.category, "academico");
    assert.equal(received!.eventId, baseEvent.eventId);
  });

  it("debe emitir a multiples observers", async () => {
    const subject = new UniversityEventSubject();
    let count = 0;

    const obs1 = { name: "O1", handle: async () => { count++; } };
    const obs2 = { name: "O2", handle: async () => { count++; } };

    subject.subscribe(obs1);
    subject.subscribe(obs2);
    await subject.emit(baseEvent);

    assert.equal(count, 2);
  });

  it("no debe fallar si un observer lanza error (fail-safe)", async () => {
    const subject = new UniversityEventSubject();
    let healthyCalled = false;

    const failingObserver = {
      name: "FailingObserver",
      handle: async () => { throw new Error("Observer crash"); },
    };
    const healthyObserver = {
      name: "HealthyObserver",
      handle: async () => { healthyCalled = true; },
    };

    subject.subscribe(failingObserver);
    subject.subscribe(healthyObserver);
    await subject.emit(baseEvent);

    assert.equal(healthyCalled, true);
  });

  it("getObserverCount debe reflejar la cantidad de observers", () => {
    const subject = new UniversityEventSubject();
    assert.equal(subject.getObserverCount(), 0);

    subject.subscribe({ name: "O1", handle: async () => {} });
    assert.equal(subject.getObserverCount(), 1);

    subject.subscribe({ name: "O2", handle: async () => {} });
    assert.equal(subject.getObserverCount(), 2);

    subject.clear();
    assert.equal(subject.getObserverCount(), 0);
  });
});

describe("AC-02: Repositorio de suscripciones", () => {
  it("subscribe debe añadir usuario a una categoría", async () => {
    const repo = new InMemorySubscriptionRepository();
    await repo.subscribe("user_1", "academico");

    const subs = await repo.getSubscribersByCategory("academico");
    assert.ok(subs.includes("user_1"));
  });

  it("unsubscribe debe remover usuario de una categoría", async () => {
    const repo = new InMemorySubscriptionRepository();
    await repo.subscribe("user_1", "academico");
    await repo.unsubscribe("user_1", "academico");

    const subs = await repo.getSubscribersByCategory("academico");
    assert.equal(subs.includes("user_1"), false);
  });

  it("getSubscribersByCategory solo retorna suscritos a esa categoría", async () => {
    const repo = new InMemorySubscriptionRepository();
    await repo.subscribe("user_A", "academico");
    await repo.subscribe("user_B", "deportivo");
    await repo.subscribe("user_C", "academico");

    const academicos = await repo.getSubscribersByCategory("academico");
    assert.deepEqual(academicos.sort(), ["user_A", "user_C"]);
  });

  it("getUserSubscriptions retorna las categorías de un usuario", async () => {
    const repo = new InMemorySubscriptionRepository();
    await repo.subscribe("user_1", "academico");
    await repo.subscribe("user_1", "deportivo");

    const cats = await repo.getUserSubscriptions("user_1");
    assert.ok(cats.includes("academico"));
    assert.ok(cats.includes("deportivo"));
    assert.equal(cats.length, 2);
  });

  it("subscribe debe ser idempotente", async () => {
    const repo = new InMemorySubscriptionRepository();
    await repo.subscribe("user_1", "academico");
    await repo.subscribe("user_1", "academico");

    const subs = await repo.getSubscribersByCategory("academico");
    assert.equal(subs.length, 1);
  });
});

describe("AC-03 y AC-04: UniversityEventObserver filtra por categoría", () => {
  let subscriptionRepo: InMemorySubscriptionRepository;
  let emitted: Array<{ userId: string; event: string; payload: Record<string, unknown> }>;

  const gateway: IEventSocketGateway = {
    emitToUser: async (userId, event, payload) => {
      emitted.push({ userId, event, payload });
    },
  };

  before(() => {
    emitted = [];
  });

  it("solo notifica a suscritos de la categoría del evento", async () => {
    subscriptionRepo = new InMemorySubscriptionRepository();
    emitted = [];

    await subscriptionRepo.subscribe("user_A", "academico");
    await subscriptionRepo.subscribe("user_B", "deportivo");
    await subscriptionRepo.subscribe("user_C", "academico");
    await subscriptionRepo.subscribe("user_D", "cultural");

    const observer = new UniversityEventObserver(subscriptionRepo, gateway);

    await observer.handle(baseEvent);

    const notifiedUserIds = emitted.map(e => e.userId).sort();
    assert.deepEqual(notifiedUserIds, ["user_A", "user_C"]);
  });

  it("debe emitir el tipo de evento correcto en el mensaje WebSocket", async () => {
    subscriptionRepo = new InMemorySubscriptionRepository();
    emitted = [];

    await subscriptionRepo.subscribe("user_X", "academico");
    const observer = new UniversityEventObserver(subscriptionRepo, gateway);
    await observer.handle(baseEvent);

    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].event, "NUEVO_EVENTO");
    assert.equal(emitted[0].userId, "user_X");
  });

  it("no debe notificar a nadie si no hay suscriptos para esa categoría", async () => {
    subscriptionRepo = new InMemorySubscriptionRepository();
    emitted = [];

    await subscriptionRepo.subscribe("user_Z", "deportivo");
    const observer = new UniversityEventObserver(subscriptionRepo, gateway);
    await observer.handle(baseEvent);

    assert.equal(emitted.length, 0);
  });

  it("debe ignorar eventos que no sean NUEVO_EVENTO", async () => {
    subscriptionRepo = new InMemorySubscriptionRepository();
    emitted = [];

    await subscriptionRepo.subscribe("user_X", "academico");
    const observer = new UniversityEventObserver(subscriptionRepo, gateway);

    await observer.handle({ ...baseEvent, type: "OTRO_EVENTO" as any });
    assert.equal(emitted.length, 0);
  });
});

describe("CreateEvent con subject integrado", () => {
  it("CreateEvent.execute debe emitir NUEVO_EVENTO cuando hay subject y category", async () => {
    const subject = new UniversityEventSubject();
    let eventReceived: UniversityEvent | null = null;

    subject.subscribe({
      name: "TestObserver",
      handle: async (event) => { eventReceived = event; },
    });

    const mockRepo = {
      create: async (input: any) => ({
        id: "event_001",
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
      getAllEvents: async () => [],
      getUpcomingEvents: async () => [],
      getById: async () => null,
      update: async () => { throw new Error("not implemented"); },
      delete: async () => {},
      updateStatus: async () => {},
    } as any;

    const { CreateEvent } = await import("../../application/use-cases/CreateEvent.js");
    const useCase = new CreateEvent(mockRepo, subject);

    await useCase.execute({
      actorUserId: "admin_1",
      title: "Nuevo Evento Test",
      description: "Descripción",
      location: "Salón A",
      startAt: "2026-06-01T09:00:00.000Z",
      category: "academico",
    });

    assert.notEqual(eventReceived, null);
    assert.equal(eventReceived!.type, "NUEVO_EVENTO");
    assert.equal(eventReceived!.category, "academico");
    assert.equal(eventReceived!.title, "Nuevo Evento Test");
  });
});
