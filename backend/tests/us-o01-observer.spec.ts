import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApplyToStudyRequest } from "../services/study-groups/src/application/use-cases/ApplyToStudyRequest.js";
import { RequestAdminTransfer } from "../services/study-groups/src/application/use-cases/RequestAdminTransfer.js";
import { ReviewApplication } from "../services/study-groups/src/application/use-cases/ReviewApplication.js";
import type { AdminTransfer } from "../services/study-groups/src/domain/entities/AdminTransfer.js";
import type { Application } from "../services/study-groups/src/domain/entities/Application.js";
import type { StudyRequest } from "../services/study-groups/src/domain/entities/StudyRequest.js";
import type { IObserver } from "../services/study-groups/src/domain/events/observers/IObserver.js";
import type { StudyGroupEvent } from "../services/study-groups/src/domain/events/StudyGroupEvents.js";
import { StudyGroupSubject } from "../services/study-groups/src/domain/events/observers/StudyGroupSubject.js";
import type { IAdminTransferRepository } from "../services/study-groups/src/domain/repositories/IAdminTransferRepository.js";
import type { IApplicationRepository } from "../services/study-groups/src/domain/repositories/IApplicationRepository.js";
import type { IStudyRequestRepository } from "../services/study-groups/src/domain/repositories/IStudyRequestRepository.js";

type SpyFn<Args extends unknown[], Return> = ((...args: Args) => Return) & {
  mock: {
    calls: Args[];
  };
  mockImplementation(implementation: (...args: Args) => Return): SpyFn<Args, Return>;
};

function createSpy<Args extends unknown[], Return>(
  implementation?: (...args: Args) => Return,
): SpyFn<Args, Return> {
  let currentImplementation = implementation;

  const spy = ((...args: Args) => {
    spy.mock.calls.push(args);

    if (!currentImplementation) {
      return undefined as Return;
    }

    return currentImplementation(...args);
  }) as SpyFn<Args, Return>;

  spy.mock = { calls: [] };
  spy.mockImplementation = (nextImplementation) => {
    currentImplementation = nextImplementation;
    return spy;
  };

  return spy;
}

async function waitFor(assertion: () => void, attempts: number = 20): Promise<void> {
  let lastError: unknown;

  for (let i = 0; i < attempts; i += 1) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  throw lastError;
}

class MockObserver implements IObserver {
  readonly name: string;

  readonly update: SpyFn<[StudyGroupEvent], void>;

  constructor(name: string = "MockObserver") {
    this.name = name;
    this.update = createSpy<[StudyGroupEvent], void>();
  }

  async handle(event: StudyGroupEvent): Promise<void> {
    this.update(event);
  }
}

describe("US-O01 - Observer para eventos de grupo de estudio", () => {
  it("Caso 1: al crear solicitud de ingreso emite SOLICITUD_INGRESO", async () => {
    const subject = new StudyGroupSubject("US-O01-Subject-Apply");
    const observer = new MockObserver("Observer-Apply");
    subject.subscribe(observer);

    const applicationCreated: Application = {
      id: "app-1",
      requestId: "req-1",
      applicantId: "user-2",
      message: "Quiero entrar al grupo",
      status: "pendiente",
      createdAt: "2026-04-29T12:00:00.000Z",
      reviewedAt: null,
    };

    const requestFound: StudyRequest = {
      id: "req-1",
      authorId: "user-1",
      subjectId: "subject-1",
      title: "Algebra",
      description: "Repaso",
      maxMembers: 5,
      status: "abierta",
      isActive: true,
      createdAt: "2026-04-29T10:00:00.000Z",
      updatedAt: "2026-04-29T10:00:00.000Z",
    };

    const applicationRepository: IApplicationRepository = {
      getByRequest: async () => [],
      getById: async () => null,
      create: async () => applicationCreated,
      review: async () => undefined,
    };

    const studyRequestRepository: IStudyRequestRepository = {
      listOpen: async () => [],
      getById: async () => requestFound,
      create: async () => requestFound,
    };

    const useCase = new ApplyToStudyRequest(
      applicationRepository,
      studyRequestRepository,
      subject,
    );

    await useCase.execute({
      requestId: "req-1",
      applicantId: "user-2",
      message: "Quiero entrar al grupo",
    });

    await waitFor(() => {
      assert.equal(observer.update.mock.calls.length, 1);
    });

    const emittedEvent = observer.update.mock.calls[0][0];
    assert.equal(emittedEvent.type, "SOLICITUD_INGRESO");
    
    const event1 = emittedEvent as any;
    assert.equal(event1.requestId, "req-1");
    assert.equal(event1.applicantId, "user-2");
    assert.equal(event1.recipientUserId, "user-1");
    assert.equal(event1.message, "Quiero entrar al grupo");
  });

  it("Caso 2: al aceptar aplicación emite MIEMBRO_ACEPTADO", async () => {
    const subject = new StudyGroupSubject("US-O01-Subject-Review");
    const observer = new MockObserver("Observer-Review");
    subject.subscribe(observer);

    const existingApplication: Application = {
      id: "app-2",
      requestId: "req-2",
      applicantId: "user-3",
      message: "Me interesa participar",
      status: "pendiente",
      createdAt: "2026-04-29T12:10:00.000Z",
      reviewedAt: null,
    };

    const reviewSpy = createSpy<[
      { applicationId: string; actorUserId: string; status: "aceptada" | "rechazada" }
    ], Promise<void>>(async () => undefined);

    const applicationRepository: IApplicationRepository = {
      getByRequest: async () => [],
      getById: async () => existingApplication,
      create: async () => existingApplication,
      review: reviewSpy,
    };

    const useCase = new ReviewApplication(applicationRepository, subject);

    await useCase.execute({
      applicationId: "app-2",
      actorUserId: "admin-1",
      status: "aceptada",
    });

    await waitFor(() => {
      assert.equal(observer.update.mock.calls.length, 1);
    });

    assert.equal(reviewSpy.mock.calls.length, 1);
    assert.deepEqual(reviewSpy.mock.calls[0][0], {
      applicationId: "app-2",
      actorUserId: "admin-1",
      status: "aceptada",
    });

    const emittedEvent = observer.update.mock.calls[0][0];
    assert.equal(emittedEvent.type, "MIEMBRO_ACEPTADO");
    
    const event2 = emittedEvent as any;
    assert.equal(event2.applicationId, "app-2");
    assert.equal(event2.requestId, "req-2");
    assert.equal(event2.applicantId, "user-3");
    assert.equal(event2.approvedBy, "admin-1");
  });

  it("Caso 3: al solicitar transferencia emite TRANSFERENCIA_ADMIN_SOLICITADA", async () => {
    const subject = new StudyGroupSubject("US-O01-Subject-Transfer");
    const observer = new MockObserver("Observer-Transfer");
    subject.subscribe(observer);

    const createdTransfer: AdminTransfer = {
      id: "transfer-1",
      requestId: "req-3",
      fromUserId: "admin-1",
      toUserId: "admin-2",
      status: "pendiente",
      createdAt: "2026-04-29T12:20:00.000Z",
      respondedAt: null,
    };

    const transferRepository: IAdminTransferRepository = {
      getById: async () => null,
      requestTransfer: async () => createdTransfer,
      acceptTransfer: async () => undefined,
      leaveAdminRole: async () => undefined,
    };

    const useCase = new RequestAdminTransfer(transferRepository, subject);

    await useCase.execute({
      requestId: "req-3",
      actorUserId: "admin-1",
      targetUserId: "admin-2",
    });

    await waitFor(() => {
      assert.equal(observer.update.mock.calls.length, 1);
    });

    const emittedEvent = observer.update.mock.calls[0][0];
    assert.equal(emittedEvent.type, "TRANSFERENCIA_ADMIN_SOLICITADA");
    
    const event3 = emittedEvent as any;
    assert.equal(event3.transferId, "transfer-1");
    assert.equal(event3.requestId, "req-3");
    assert.equal(event3.actorUserId, "admin-1");
    assert.equal(event3.targetUserId, "admin-2");
  });
});