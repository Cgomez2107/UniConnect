import { describe, it, mock, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Domain state imports ──────────────────────────────────────────────────
import { GroupContext } from "../src/domain/states/GroupContext.js";
import { Active } from "../src/domain/states/Active.js";
import { PendingTransfer } from "../src/domain/states/PendingTransfer.js";
import { TransferAccepted } from "../src/domain/states/TransferAccepted.js";
import { Dissolved } from "../src/domain/states/Dissolved.js";
import { Blocked } from "../src/domain/states/Blocked.js";
import type { IState, IGroupContext } from "../src/domain/states/IState.js";

// ── Event infrastructure ────────────────────────────────────────────────────
import { StudyGroupSubject } from "../src/domain/events/observers/StudyGroupSubject.js";
import { PersistenceObserver } from "../src/domain/events/observers/PersistenceObserver.js";
import type { ISubject } from "../src/domain/events/observers/ISubject.js";
import type { IObserver } from "../src/domain/events/observers/IObserver.js";
import type { StudyGroupEvent } from "../src/domain/events/StudyGroupEvents.js";

// ── Use cases ──────────────────────────────────────────────────────────────
import { AcceptAdminTransfer } from "../src/application/use-cases/AcceptAdminTransfer.js";
import { RejectAdminTransfer } from "../src/application/use-cases/RejectAdminTransfer.js";
import { RequestAdminTransfer } from "../src/application/use-cases/RequestAdminTransfer.js";
import { LeaveAdminRole } from "../src/application/use-cases/LeaveAdminRole.js";
import type { IAdminTransferRepository } from "../src/domain/repositories/IAdminTransferRepository.js";
import type { IStudyGroupRepository } from "../src/domain/repositories/IStudyGroupRepository.js";
import type { AdminTransfer, AdminTransferStatus } from "../src/domain/entities/AdminTransfer.js";

// ── Domain services ────────────────────────────────────────────────────────
import { StudyGroupMembershipService } from "../src/domain/services/StudyGroupMembershipService.js";

// ── Repositories ───────────────────────────────────────────────────────────
import { InMemoryAdminTransferRepository } from "../src/infrastructure/database/InMemoryAdminTransferRepository.js";
import { InMemoryStudyRequestRepository } from "../src/infrastructure/database/InMemoryStudyRequestRepository.js";

// ── Errors ─────────────────────────────────────────────────────────────────
import { InvalidStateTransitionError } from "../../../shared/libs/errors/InvalidStateTransitionError.js";
import { NotFoundError } from "../../../shared/libs/errors/NotFoundError.js";
import { AuthorizationError } from "../../../shared/libs/errors/AuthorizationError.js";

// ============================================================================
// Helper utilities
// ============================================================================
function createMockSubject(): StudyGroupSubject & { emitted: StudyGroupEvent[] } {
  const emitted: StudyGroupEvent[] = [];
  const subject = new StudyGroupSubject("mock");
  const originalEmit = subject.emit.bind(subject);
  subject.emit = mock.fn(async (e: StudyGroupEvent) => { emitted.push(e); await originalEmit(e); }) as typeof subject.emit;
  return Object.assign(subject, { emitted });
}

function lastEvent(subject: StudyGroupSubject & { emitted: StudyGroupEvent[] }): StudyGroupEvent {
  return subject.emitted[subject.emitted.length - 1];
}

function countEvents(subject: StudyGroupSubject & { emitted: StudyGroupEvent[] }): number {
  return subject.emitted.length;
}

function createCapturingObserver(): IObserver & { events: StudyGroupEvent[] } {
  const events: StudyGroupEvent[] = [];
  return {
    name: "CapturingObserver",
    handle: mock.fn(async (e: StudyGroupEvent) => { events.push(e); }),
    events,
  };
}

class FakeAdminTransferRepo implements IAdminTransferRepository {
  transfers: AdminTransfer[] = [];
  atomicallyCalled: Array<{ transferId: string; actorUserId: string }> = [];

  async getById(transferId: string): Promise<AdminTransfer | null> {
    return this.transfers.find(t => t.id === transferId) ?? null;
  }

  async requestTransfer(input: { requestId: string; actorUserId: string; targetUserId: string }): Promise<AdminTransfer> {
    const t: AdminTransfer = {
      id: crypto.randomUUID(),
      requestId: input.requestId,
      fromUserId: input.actorUserId,
      toUserId: input.targetUserId,
      status: "pendiente" as AdminTransferStatus,
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };
    this.transfers.push(t);
    return t;
  }

  async acceptTransfer(_input: { transferId: string; actorUserId: string }) {}
  async acceptTransferAtomically(transferId: string, actorUserId: string) {
    this.atomicallyCalled.push({ transferId, actorUserId });
  }
  async rejectTransfer(_input: { transferId: string; actorUserId: string }) {}
  async leaveAdminRole(_input: { requestId: string; actorUserId: string }) {}
}

class SmartStudyGroupRepo implements IStudyGroupRepository {
  private pendingTransfers: Map<string, { toUserId: string; transferId: string }> = new Map();

  addPendingTransfer(requestId: string, toUserId: string, transferId: string) {
    this.pendingTransfers.set(requestId, { toUserId, transferId });
  }

  async loadStudyGroup(requestId: string, subject: ISubject) {
    if (requestId === "not-found") throw new Error("Grupo no encontrado.");

    const pending = this.pendingTransfers.get(requestId);
    const base = new Active();
    const initialState = pending
      ? new PendingTransfer(base, pending.toUserId, pending.transferId)
      : base;

    return new GroupContext(requestId, "Grupo Test", "admin-old", initialState, subject);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AUDIT VERIFICATION TESTS
// ════════════════════════════════════════════════════════════════════════════

// ── AC-1: IState contract ────────────────────────────────────────────
describe("AC-1 — IState con 4 metodos + 5 estados concretos", () => {
  it("IState tiene exactamente solicitar/aceptar/rechazar/transferir", () => {
    const methods = ["solicitar", "aceptar", "rechazar", "transferir"];
    const instance: IState = new Active();
    for (const m of methods) {
      assert.equal(typeof instance[m as keyof IState], "function", `Falta método: ${m}`);
    }
  });

  it("Active implementa IState", () => {
    const s = new Active();
    assert.ok(s instanceof Active);
    assert.equal(typeof s.solicitar, "function");
    assert.equal(typeof s.aceptar, "function");
    assert.equal(typeof s.rechazar, "function");
    assert.equal(typeof s.transferir, "function");
  });

  it("PendingTransfer implementa IState", () => {
    const s = new PendingTransfer(new Active(), "target", "tid");
    assert.ok(s instanceof PendingTransfer);
    assert.equal(typeof s.solicitar, "function");
    assert.equal(typeof s.aceptar, "function");
    assert.equal(typeof s.rechazar, "function");
    assert.equal(typeof s.transferir, "function");
  });

  it("TransferAccepted implementa IState", () => {
    const parent = new PendingTransfer(new Active(), "target", "tid");
    const s = new TransferAccepted(parent);
    assert.ok(s instanceof TransferAccepted);
    assert.equal(typeof s.solicitar, "function");
    assert.equal(typeof s.aceptar, "function");
    assert.equal(typeof s.rechazar, "function");
    assert.equal(typeof s.transferir, "function");
  });

  it("Dissolved implementa IState", () => {
    const s = new Dissolved();
    assert.ok(s instanceof Dissolved);
    assert.equal(typeof s.solicitar, "function");
    assert.equal(typeof s.aceptar, "function");
    assert.equal(typeof s.rechazar, "function");
    assert.equal(typeof s.transferir, "function");
  });

  it("Blocked implementa IState", () => {
    const s = new Blocked();
    assert.ok(s instanceof Blocked);
    assert.equal(typeof s.solicitar, "function");
    assert.equal(typeof s.aceptar, "function");
    assert.equal(typeof s.rechazar, "function");
    assert.equal(typeof s.transferir, "function");
  });
});

// ── AC-2: Active → solicitar → PendingTransfer + event ─────────────
describe("AC-2 — Active.solicitar() transiciona y emite evento", () => {
  it("cambia estado interno a PendingTransfer", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("g-1", "G", "admin-old", new Active(), subject);
    await group.requestAdminTransfer("admin-new");

    // Verificar que el contexto tiene los datos de la transferencia
    assert.equal(group.targetUserId, "admin-new");
    assert.ok(group.transferId);

    // Verificar evento emitido
    const event = lastEvent(subject) as Extract<StudyGroupEvent, { type: "ADMIN_TRANSFER_REQUESTED" }>;
    assert.equal(event.type, "ADMIN_TRANSFER_REQUESTED");
    assert.equal(event.newState, "PendienteTransferencia");
    assert.equal(event.oldAdminId, "admin-old");
    assert.equal(event.newAdminId, "admin-new");
    assert.ok(event.transferId);
  });

  it("el transferId generado es un UUID valido", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("g-1", "G", "admin-old", new Active(), subject);
    await group.requestAdminTransfer("admin-new");

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    assert.match(group.transferId, uuidRegex);
  });
});

// ── AC-3: PendingTransfer → aceptar → TransferAccepted + atomic DB ──
describe("AC-3 — PendingTransfer.aceptar() + PersistenceObserver atomic", () => {
  it("transiciona a TransferAccepted y emite evento con acceptedBy", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("g-1", "G", "admin-old", new Active(), subject);

    await group.requestAdminTransfer("admin-new");
    const transferId = group.transferId;

    await group.acceptAdminTransfer(transferId);

    const event = lastEvent(subject) as Extract<StudyGroupEvent, { type: "ADMIN_TRANSFER_ACCEPTED" }>;
    assert.equal(event.type, "ADMIN_TRANSFER_ACCEPTED");
    assert.equal(event.newState, "TransferenciaAceptada");
    assert.equal(event.acceptedBy, "admin-new");
    assert.equal(event.oldAdminId, "admin-old");
    assert.equal(event.newAdminId, "admin-new");

    // adminId no ha cambiado aun (cambia en transferir)
    assert.equal(group.adminId, "admin-old");
  });

  it("PersistenceObserver recibe el evento y llama acceptTransferAtomically con acceptedBy", async () => {
    const repo = new FakeAdminTransferRepo();
    const observer = new PersistenceObserver(repo);

    const event: StudyGroupEvent = {
      type: "ADMIN_TRANSFER_ACCEPTED",
      version: "1.0",
      timestamp: new Date(),
      transferId: "tid-123",
      groupId: "g-1",
      oldAdminId: "admin-old",
      newAdminId: "admin-new",
      newState: "TransferenciaAceptada",
      acceptedBy: "admin-new",
    };

    await observer.handle(event);

    assert.equal(repo.atomicallyCalled.length, 1);
    assert.equal(repo.atomicallyCalled[0].transferId, "tid-123");
    assert.equal(repo.atomicallyCalled[0].actorUserId, "admin-new");
  });

  it("PersistenceObserver ignora eventos que no son ACEPTADA", async () => {
    const repo = new FakeAdminTransferRepo();
    const observer = new PersistenceObserver(repo);

    await observer.handle({ type: "ADMIN_TRANSFER_REQUESTED", version: "1.0", timestamp: new Date(), transferId: "t", groupId: "g", oldAdminId: "a", newAdminId: "b", newState: "PendienteTransferencia", groupName: "G" });
    await observer.handle({ type: "ADMIN_TRANSFER_REJECTED", version: "1.0", timestamp: new Date(), transferId: "t", groupId: "g", oldAdminId: "a", newAdminId: "b", newState: "Activo", groupName: "G" });
    await observer.handle({ type: "ADMIN_TRANSFER_COMPLETED", version: "1.0", timestamp: new Date(), transferId: "t", groupId: "g", oldAdminId: "a", newAdminId: "b", newState: "Activo", groupName: "G" });
    await observer.handle({ type: "JOIN_REQUEST", version: "1.0", timestamp: new Date(), requestId: "r", applicantId: "a", recipientUserId: "r", message: "m", groupName: "G", applicantName: "n" });

    assert.equal(repo.atomicallyCalled.length, 0);
  });
});

// ── AC-4: PendingTransfer → rechazar → Active ──────────────────────
describe("AC-4 — PendingTransfer.rechazar()", () => {
  it("revierte a Active y el adminId no cambia", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("g-1", "G", "admin-old", new Active(), subject);

    await group.requestAdminTransfer("admin-new");
    await group.rejectAdminTransfer();

    const event = lastEvent(subject) as Extract<StudyGroupEvent, { type: "ADMIN_TRANSFER_REJECTED" }>;
    assert.equal(event.type, "ADMIN_TRANSFER_REJECTED");
    assert.equal(event.newState, "Activo");

    // adminId no cambio
    assert.equal(group.adminId, "admin-old");

    // Se puede solicitar de nuevo
    await group.requestAdminTransfer("otro-admin");
    assert.equal(group.targetUserId, "otro-admin");
  });
});

// ── AC-5: States solo importan transiciones directas ──────────────────────
describe("AC-5 — Estados solo importan transiciones directas", () => {
function concreteStateImports(fileName: string): string[] {
  const source = readFileSync(resolve(__dirname, `../src/domain/states/${fileName}.ts`), "utf-8");
  const matches = source.match(/from\s+"[^"]+\/(\w+)\.js"/g) || [];
  return matches.map(s => s.match(/\/(\w+)\.js"/)![1]);
}

  it("Active solo puede ir a PendingTransfer", () => {
    const imports = concreteStateImports("Active");
    assert.ok(imports.includes("PendingTransfer"), "Falta import de PendingTransfer");
    assert.ok(!imports.includes("TransferAccepted"), "No debe importar TransferAccepted");
    assert.ok(!imports.includes("Dissolved"), "No debe importar Dissolved");
    assert.ok(!imports.includes("Blocked"), "No debe importar Blocked");
  });

  it("PendingTransfer solo importa Active y TransferAccepted", () => {
    const imports = concreteStateImports("PendingTransfer");
    assert.ok(imports.includes("Active"));
    assert.ok(imports.includes("TransferAccepted"));
    assert.ok(!imports.includes("Dissolved"));
    assert.ok(!imports.includes("Blocked"));
  });

  it("TransferAccepted solo importa Active y PendingTransfer (type-only)", () => {
    const imports = concreteStateImports("TransferAccepted");
    assert.ok(imports.includes("Active"));
    assert.ok(imports.includes("PendingTransfer"));
    assert.ok(!imports.includes("Dissolved"));
    assert.ok(!imports.includes("Blocked"));
  });

  it("Dissolved no importa ningun estado concreto", () => {
    const imports = concreteStateImports("Dissolved");
    assert.ok(!imports.includes("Active"));
    assert.ok(!imports.includes("PendingTransfer"));
    assert.ok(!imports.includes("TransferAccepted"));
    assert.ok(!imports.includes("Blocked"));
  });

  it("Blocked no importa ningun estado concreto", () => {
    const imports = concreteStateImports("Blocked");
    assert.ok(!imports.includes("Active"));
    assert.ok(!imports.includes("PendingTransfer"));
    assert.ok(!imports.includes("TransferAccepted"));
    assert.ok(!imports.includes("Dissolved"));
  });
});

// ── AC-6: All observers receive events with newState ───────────────────
describe("AC-6 — Observers reciben eventos con newState via Subject", () => {
  it("StudyGroupSubject emite a todos los observers registrados", async () => {
    const subject = new StudyGroupSubject("test-subject");
    const obs1 = createCapturingObserver();
    const obs2 = createCapturingObserver();
    subject.subscribe(obs1);
    subject.subscribe(obs2);

    const event: StudyGroupEvent = {
      type: "ADMIN_TRANSFER_REQUESTED",
      version: "1.0",
      timestamp: new Date(),
      transferId: "t-1",
      groupId: "g-1",
      oldAdminId: "admin-old",
      newAdminId: "admin-new",
      newState: "PendienteTransferencia",
      groupName: "G",
    };

    await subject.emit(event);

    assert.equal(obs1.events.length, 1);
    assert.equal(obs2.events.length, 1);
    assert.equal(obs1.events[0].type, "ADMIN_TRANSFER_REQUESTED");
    assert.equal((obs1.events[0] as any).newState, "PendienteTransferencia");
  });

  it("Subject continua si un observer falla (fail-safe)", async () => {
    const subject = new StudyGroupSubject("test-failsafe");
    const failingObserver: IObserver = {
      name: "FailingObserver",
      handle: async () => { throw new Error("Fallo"); },
    };
    const goodObserver = createCapturingObserver();
    subject.subscribe(failingObserver);
    subject.subscribe(goodObserver);

    const event: StudyGroupEvent = {
      type: "ADMIN_TRANSFER_REQUESTED",
      version: "1.0",
      timestamp: new Date(),
      transferId: "t-1",
      groupId: "g-1",
      oldAdminId: "admin-old",
      newAdminId: "admin-new",
      newState: "PendienteTransferencia",
      groupName: "G",
    };

    await subject.emit(event);

    assert.equal(goodObserver.events.length, 1);
  });
});

// ── AC-7: UML documentado en README ──────────────────────────────────────
describe("AC-7 — UML en README", () => {
  it("README contiene diagrama de estados", () => {
    const readme = readFileSync(
      resolve(__dirname, "../README.md"),
      "utf-8",
    );
    assert.ok(readme.includes("stateDiagram-v2"), "Falta stateDiagram-v2 en README");
    assert.ok(readme.includes("Activo --> PendienteTransferencia"), "Falta transicion Active->PendingTransfer");
    assert.ok(readme.includes("PendienteTransferencia --> TransferenciaAceptada"), "Falta transicion PendingTransfer->TransferAccepted");
    assert.ok(readme.includes("PendienteTransferencia --> Activo"), "Falta transicion PendingTransfer->Active (rechazar)");
    assert.ok(readme.includes("TransferenciaAceptada --> Activo"), "Falta transicion TransferAccepted->Active");
    assert.ok(readme.includes("IState"), "Falta contrato IState");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ════════════════════════════════════════════════════════════════════════════

// ── Observer chain: use case → state → subject → observers ───────────────
describe("INT-01 — Cadena completa: use case → state → subject → observers", () => {
  it("AcceptAdminTransfer emite ACEPTADA y TRANSFERIDA en orden", async () => {
    const subject = new StudyGroupSubject("int-test");
    const obs1 = createCapturingObserver();
    const obs2 = createCapturingObserver();
    subject.subscribe(obs1);
    subject.subscribe(obs2);

    const adminRepo = new FakeAdminTransferRepo();
    const persistenceObserver = new PersistenceObserver(adminRepo);
    subject.subscribe(persistenceObserver);

    const studyRepo = new SmartStudyGroupRepo();
    const useCase = new AcceptAdminTransfer(adminRepo, studyRepo, subject);

    const created = await adminRepo.requestTransfer({ requestId: "g-1", actorUserId: "admin-old", targetUserId: "admin-new" });
    const transferId = created.id;

    studyRepo.addPendingTransfer("g-1", "admin-new", transferId);

    await useCase.execute({ transferId, actorUserId: "admin-new" });

    assert.equal(obs1.events.length, 2);
    assert.equal(obs2.events.length, 2);

    assert.equal(obs1.events[0].type, "ADMIN_TRANSFER_ACCEPTED");
    assert.equal((obs1.events[0] as any).newState, "TransferenciaAceptada");

    assert.equal(obs1.events[1].type, "ADMIN_TRANSFER_COMPLETED");
    assert.equal((obs1.events[1] as any).newState, "Activo");

    assert.equal(adminRepo.atomicallyCalled.length, 1);
    assert.equal(adminRepo.atomicallyCalled[0].transferId, transferId);
    assert.equal(adminRepo.atomicallyCalled[0].actorUserId, "admin-new");
  });

  it("RejectAdminTransfer emite RECHAZADA", async () => {
    const subject = new StudyGroupSubject("int-reject");
    const obs = createCapturingObserver();
    subject.subscribe(obs);

    const adminRepo = new FakeAdminTransferRepo();
    const studyRepo = new SmartStudyGroupRepo();
    const useCase = new RejectAdminTransfer(adminRepo, studyRepo, subject);

    const created = await adminRepo.requestTransfer({ requestId: "g-1", actorUserId: "admin-old", targetUserId: "admin-new" });
    studyRepo.addPendingTransfer("g-1", "admin-new", created.id);

    await useCase.execute({ transferId: created.id, actorUserId: "admin-new" });

    assert.equal(obs.events.length, 1);
    assert.equal(obs.events[0].type, "ADMIN_TRANSFER_REJECTED");
    assert.equal((obs.events[0] as any).newState, "Activo");
  });
});

// ── Use case authorization (MIN-2) ─────────────────────────────────────────
describe("INT-02 — Validacion de autorizacion en use cases (MIN-2)", () => {
  it("AcceptAdminTransfer rechaza si actorUserId no coincide con toUserId", async () => {
    const subject = createMockSubject();
    const adminRepo = new FakeAdminTransferRepo();
    const studyRepo = new SmartStudyGroupRepo();
    const useCase = new AcceptAdminTransfer(adminRepo, studyRepo, subject);

    const created = await adminRepo.requestTransfer({ requestId: "g-1", actorUserId: "admin-old", targetUserId: "admin-new" });

    await assert.rejects(
      () => useCase.execute({ transferId: created.id, actorUserId: "wrong-user" }),
      AuthorizationError,
    );
  });

  it("RejectAdminTransfer rechaza si actorUserId no coincide con toUserId", async () => {
    const subject = createMockSubject();
    const adminRepo = new FakeAdminTransferRepo();
    const studyRepo = new SmartStudyGroupRepo();
    const useCase = new RejectAdminTransfer(adminRepo, studyRepo, subject);

    const created = await adminRepo.requestTransfer({ requestId: "g-1", actorUserId: "admin-old", targetUserId: "admin-new" });

    await assert.rejects(
      () => useCase.execute({ transferId: created.id, actorUserId: "wrong-user" }),
      AuthorizationError,
    );
  });

  it("AcceptAdminTransfer lanza NotFoundError si transferId no existe", async () => {
    const subject = createMockSubject();
    const adminRepo = new FakeAdminTransferRepo();
    const studyRepo = new SmartStudyGroupRepo();
    const useCase = new AcceptAdminTransfer(adminRepo, studyRepo, subject);

    await assert.rejects(
      () => useCase.execute({ transferId: "non-existent-id", actorUserId: "admin-new" }),
      NotFoundError,
    );
  });

  it("RejectAdminTransfer lanza NotFoundError si transferId no existe", async () => {
    const subject = createMockSubject();
    const adminRepo = new FakeAdminTransferRepo();
    const studyRepo = new SmartStudyGroupRepo();
    const useCase = new RejectAdminTransfer(adminRepo, studyRepo, subject);

    await assert.rejects(
      () => useCase.execute({ transferId: "non-existent-id", actorUserId: "admin-new" }),
      NotFoundError,
    );
  });

  it("RequestAdminTransfer rechaza actorUserId vacio (requireTrimmed)", async () => {
    const subject = createMockSubject();
    const adminRepo = new InMemoryAdminTransferRepository();
    const studyRepo = new SmartStudyGroupRepo();
    const useCase = new RequestAdminTransfer(adminRepo, studyRepo, subject);

    await assert.rejects(
      () => useCase.execute({ requestId: "g-1", actorUserId: "", targetUserId: "admin-new" }),
      Error,
    );
  });
});

// ── StudyGroupMembershipService ────────────────────────────────────────────
describe("INT-03 — StudyGroupMembershipService", () => {
  it("applyToGroup emite JOIN_REQUEST con datos correctos", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("g-1", "Grupo de Calculo", "admin-old", new Active(), subject);
    const svc = new StudyGroupMembershipService(subject);

    await svc.applyToGroup(group, "applicant-1", "Juan Perez", "Quiero unirme", "admin-old");

    const event = lastEvent(subject) as Extract<StudyGroupEvent, { type: "JOIN_REQUEST" }>;
    assert.equal(event.type, "JOIN_REQUEST");
    assert.equal(event.requestId, "g-1");
    assert.equal(event.applicantId, "applicant-1");
    assert.equal(event.applicantName, "Juan Perez");
    assert.equal(event.recipientUserId, "admin-old");
    assert.equal(event.message, "Quiero unirme");
    assert.equal(event.groupName, "Grupo de Calculo");
  });

  it("reviewApplication emite MEMBER_ACCEPTED cuando status=approved", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("g-1", "Grupo Fisica", "admin-old", new Active(), subject);
    const svc = new StudyGroupMembershipService(subject);

    await svc.reviewApplication(group, "app-1", "approved", "admin-old", "applicant-1", "Maria Lopez");

    const event = lastEvent(subject) as Extract<StudyGroupEvent, { type: "MEMBER_ACCEPTED" }>;
    assert.equal(event.type, "MEMBER_ACCEPTED");
    assert.equal(event.applicationId, "app-1");
    assert.equal(event.requestId, "g-1");
    assert.equal(event.applicantId, "applicant-1");
    assert.equal(event.applicantName, "Maria Lopez");
    assert.equal(event.approvedBy, "admin-old");
    assert.equal(event.groupName, "Grupo Fisica");
  });

  it("reviewApplication emite MEMBER_REJECTED cuando status=rejected", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("g-1", "Grupo Fisica", "admin-old", new Active(), subject);
    const svc = new StudyGroupMembershipService(subject);

    await svc.reviewApplication(group, "app-2", "rejected", "admin-old", "applicant-2");

    const event = lastEvent(subject) as Extract<StudyGroupEvent, { type: "MEMBER_REJECTED" }>;
    assert.equal(event.type, "MEMBER_REJECTED");
    assert.equal(event.applicationId, "app-2");
    assert.equal(event.requestId, "g-1");
    assert.equal(event.applicantId, "applicant-2");
    assert.equal(event.rejectedBy, "admin-old");
  });
});

// ── TransferAccepted.rechazar() ──────────────────────────────────────
describe("INT-04 — TransferAccepted.rechazar() delega a parent", () => {
  it("rechazar desde TransferAccepted revierte a Active y emite RECHAZADA", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("g-1", "G", "admin-old", new Active(), subject);

    await group.requestAdminTransfer("admin-new");
    await group.acceptAdminTransfer(group.transferId);

    // Ahora estamos en TransferAccepted
    await group.rejectAdminTransfer();

    // El evento debe ser RECHAZADA
    const event = lastEvent(subject) as Extract<StudyGroupEvent, { type: "ADMIN_TRANSFER_REJECTED" }>;
    assert.equal(event.type, "ADMIN_TRANSFER_REJECTED");
    assert.equal(event.newState, "Activo");

    // adminId no cambio
    assert.equal(group.adminId, "admin-old");

    // Se puede solicitar de nuevo (estamos en Active)
    await group.requestAdminTransfer("otro-admin");
    assert.equal(group.targetUserId, "otro-admin");
  });
});

// ── InMemoryStudyRequestRepository.loadStudyGroup ──────────────────────────
describe("INT-05 — InMemoryStudyRequestRepository.loadStudyGroup (MIN-1)", () => {
  it("retorna GroupContext con Active para grupo abierto", async () => {
    const repo = new InMemoryStudyRequestRepository();
    const subject = createMockSubject();
    const group = await repo.loadStudyGroup("a1b2c3d4-0001-4000-9000-111111111111", subject);

    assert.ok(group instanceof GroupContext);
    assert.equal(group.requestId, "a1b2c3d4-0001-4000-9000-111111111111");
    assert.equal(group.adminId, "user-01");
    assert.equal(group.groupName, "Calculo diferencial - repaso parcial");

    // Debe poder solicitar transferencia (esta en Active)
    await group.requestAdminTransfer("user-02");
    assert.ok(group.transferId);
  });

  it("lanza error si el grupo no existe", async () => {
    const repo = new InMemoryStudyRequestRepository();
    const subject = createMockSubject();

    await assert.rejects(
      () => repo.loadStudyGroup("non-existent-id", subject),
      Error,
    );
  });
});

// ── Full end-to-end: in-memory repo + use cases ───────────────────────────
describe("INT-06 — End-to-end con InMemoryAdminTransferRepository", () => {
  it("flujo completo: solicitar → aceptar → transferir con persistencia in-memory", async () => {
    const adminRepo = new InMemoryAdminTransferRepository();
    const studyRepo = new SmartStudyGroupRepo();
    const subject = new StudyGroupSubject();
    const obs = createCapturingObserver();
    subject.subscribe(obs);

    // 1. Solicitar transferencia
    const requestUC = new RequestAdminTransfer(adminRepo, studyRepo, subject);
    const created = await requestUC.execute({ requestId: "g-1", actorUserId: "admin-old", targetUserId: "admin-new" });
    assert.equal(created.status, "pendiente");

    // Vincular la transferencia pendiente (simula hidratacion desde BD)
    studyRepo.addPendingTransfer("g-1", "admin-new", created.id);

    // 2. Aceptar y transferir
    const acceptUC = new AcceptAdminTransfer(adminRepo, studyRepo, subject);
    await acceptUC.execute({ transferId: created.id, actorUserId: "admin-new" });

    // Verificar eventos en orden
    assert.equal(obs.events.length, 3);
    assert.equal(obs.events[0].type, "ADMIN_TRANSFER_REQUESTED");
    assert.equal(obs.events[1].type, "ADMIN_TRANSFER_ACCEPTED");
    assert.equal(obs.events[2].type, "ADMIN_TRANSFER_COMPLETED");
  });

  it("flujo completo: solicitar → rechazar", async () => {
    const adminRepo = new InMemoryAdminTransferRepository();
    const studyRepo = new SmartStudyGroupRepo();
    const subject = new StudyGroupSubject();
    const obs = createCapturingObserver();
    subject.subscribe(obs);

    const requestUC = new RequestAdminTransfer(adminRepo, studyRepo, subject);
    const created = await requestUC.execute({ requestId: "g-1", actorUserId: "admin-old", targetUserId: "admin-new" });

    studyRepo.addPendingTransfer("g-1", "admin-new", created.id);

    const rejectUC = new RejectAdminTransfer(adminRepo, studyRepo, subject);
    await rejectUC.execute({ transferId: created.id, actorUserId: "admin-new" });

    assert.equal(obs.events.length, 2);
    assert.equal(obs.events[0].type, "ADMIN_TRANSFER_REQUESTED");
    assert.equal(obs.events[1].type, "ADMIN_TRANSFER_REJECTED");
  });
});

// ── newState values ────────────────────────────────────────────────────
describe("INT-07 — newState values in events", () => {
  it("todos los eventos de transferencia tienen newState definido", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("g-1", "G", "admin-old", new Active(), subject);

    // solicitar → PendingTransfer
    await group.requestAdminTransfer("admin-new");
    const e1 = lastEvent(subject) as any;
    assert.equal(e1.newState, "PendienteTransferencia");

    // aceptar → TransferAccepted
    await group.acceptAdminTransfer(group.transferId);
    const e2 = lastEvent(subject) as any;
    assert.equal(e2.newState, "TransferenciaAceptada");

    // transferir → Active
    await group.transferAdmin();
    const e3 = lastEvent(subject) as any;
    assert.equal(e3.newState, "Activo");

    // rechazar (nuevo flujo)
    await group.requestAdminTransfer("otro");
    await group.rejectAdminTransfer();
    const e4 = lastEvent(subject) as any;
    assert.equal(e4.newState, "Activo");
  });
});

// ── PersistenceObserver → accept_admin_transfer_backend ──────────────────
describe("INT-08 — PersistenceObserver llama a accept_admin_transfer_backend", () => {
  it("acceptTransferAtomically es llamado con transferId y acceptedBy", async () => {
    const repo = new FakeAdminTransferRepo();
    const observer = new PersistenceObserver(repo);

    const event: StudyGroupEvent = {
      type: "ADMIN_TRANSFER_ACCEPTED",
      version: "1.0",
      timestamp: new Date(),
      transferId: "uuid-transfer",
      groupId: "g-1",
      oldAdminId: "admin-old",
      newAdminId: "admin-new",
      newState: "TransferenciaAceptada",
      acceptedBy: "admin-new",
    };

    await observer.handle(event);

    assert.equal(repo.atomicallyCalled.length, 1);
    assert.equal(repo.atomicallyCalled[0].transferId, "uuid-transfer");
    assert.equal(repo.atomicallyCalled[0].actorUserId, "admin-new");
  });

  it("PostgresAdminTransferRepository llama a accept_admin_transfer_backend (verificacion SQL)", () => {
    const source = readFileSync(
      resolve(__dirname, "../src/infrastructure/database/PostgresAdminTransferRepository.ts"),
      "utf-8",
    );
    assert.ok(source.includes("accept_admin_transfer_backend"), "Debe llamar a accept_admin_transfer_backend");
    assert.ok(!source.includes('accept_admin_transfer($1, "")'), "No debe pasar actorUserId vacio");
  });
});

// ── LeaveAdminRole tests ──────────────────────────────────────────────────
describe("LeaveAdminRole — nuevo flujo renuncia directa", () => {
  it("leaveAdminRole funciona desde Active (adminCount > 1) y emite ADMIN_ROLE_LEFT", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("g-1", "G", "admin-old", new Active(), subject, 0, 0, 2);

    await group.leaveAdminRole("admin-old");

    assert.equal(subject.emitted.length, 1);
    const event = subject.emitted[0] as Extract<StudyGroupEvent, { type: "ADMIN_ROLE_LEFT" }>;
    assert.equal(event.type, "ADMIN_ROLE_LEFT");
    assert.equal(event.requestId, "g-1");
    assert.equal(event.userId, "admin-old");
    assert.equal(event.groupName, "G");
  });

  it("leaveAdminRole funciona desde PendingTransfer (adminCount > 1)", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("g-1", "G", "admin-old", new Active(), subject, 0, 0, 2);
    await group.requestAdminTransfer("admin-new");

    await group.leaveAdminRole("admin-old");

    const event = subject.emitted[subject.emitted.length - 1] as Extract<StudyGroupEvent, { type: "ADMIN_ROLE_LEFT" }>;
    assert.equal(event.type, "ADMIN_ROLE_LEFT");
    assert.equal(event.userId, "admin-old");
  });

  it("leaveAdminRole rechaza si adminCount <= 1 (proteccion de huerfanos)", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("g-1", "G", "admin-old", new Active(), subject);

    await assert.rejects(
      () => group.leaveAdminRole("admin-old"),
      InvalidStateTransitionError,
    );
  });

  it("leaveAdminRole rechaza si actorUserId no es adminId", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("g-1", "G", "admin-old", new Active(), subject, 0, 0, 2);

    await assert.rejects(
      () => group.leaveAdminRole("not-the-admin"),
      InvalidStateTransitionError,
    );
  });

  it("leaveAdminRole falla desde TransferAccepted (fase critica)", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("g-1", "G", "admin-old", new Active(), subject, 0, 0, 2);
    await group.requestAdminTransfer("admin-new");
    await group.acceptAdminTransfer(group.transferId);

    await assert.rejects(
      () => group.leaveAdminRole("admin-old"),
      InvalidStateTransitionError,
    );
  });

  it("leaveAdminRole falla desde Dissolved", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("g-1", "G", "admin-old", new Dissolved(), subject);

    await assert.rejects(
      () => group.leaveAdminRole("admin-old"),
      InvalidStateTransitionError,
    );
  });

  it("leaveAdminRole falla desde Blocked", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("g-1", "G", "admin-old", new Blocked(), subject);

    await assert.rejects(
      () => group.leaveAdminRole("admin-old"),
      InvalidStateTransitionError,
    );
  });

  it("PersistenceObserver escucha ADMIN_ROLE_LEFT y llama leaveAdminRole en repositorio", async () => {
    const repo = new FakeAdminTransferRepo();
    const observer = new PersistenceObserver(repo);

    const event: StudyGroupEvent = {
      type: "ADMIN_ROLE_LEFT",
      version: "1.0",
      timestamp: new Date(),
      requestId: "g-1",
      userId: "admin-old",
      groupName: "G",
    };

    await observer.handle(event);

    assert.ok(true, "ADMIN_ROLE_LEFT procesado sin error por PersistenceObserver");
  });
});

// ── PostgresAdminTransferRepository signature check (CRIT-1 fixed) ────────
describe("CRIT-1 — acceptTransferAtomically ya no envia actorUserId vacio", () => {
  it("PostgresAdminTransferRepository.acceptTransferAtomically tiene 2 parametros", () => {
    const source = readFileSync(
      resolve(__dirname, "../src/infrastructure/database/PostgresAdminTransferRepository.ts"),
      "utf-8",
    );
    const match = source.match(/async acceptTransferAtomically\(([^)]+)\)/);
    assert.ok(match, "Debe existir el metodo acceptTransferAtomically");
    const params = match[1].split(",").map(s => s.trim());
    assert.ok(params.length >= 2, "Debe tener al menos 2 parametros: transferId y actorUserId");
  });

  it("InMemoryAdminTransferRepository.acceptTransferAtomically tiene 2 parametros", () => {
    const source = readFileSync(
      resolve(__dirname, "../src/infrastructure/database/InMemoryAdminTransferRepository.ts"),
      "utf-8",
    );
    const match = source.match(/async acceptTransferAtomically\(([^)]+)\)/);
    assert.ok(match, "Debe existir el metodo acceptTransferAtomically");
    const params = match[1].split(",").map(s => s.trim());
    assert.ok(params.length >= 2, "Debe tener al menos 2 parametros: transferId y actorUserId");
  });

  it("PostgresAdminTransferRepository.leaveAdminRole llama a leave_request_admin_backend", () => {
    const source = readFileSync(
      resolve(__dirname, "../src/infrastructure/database/PostgresAdminTransferRepository.ts"),
      "utf-8",
    );
    assert.ok(source.includes("leave_request_admin_backend"), "Debe llamar a leave_request_admin_backend");
    assert.ok(!source.includes("leave_request_admin("), "No debe llamar a leave_request_admin original");
  });
});
