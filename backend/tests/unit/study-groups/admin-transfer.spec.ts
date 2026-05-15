import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { RequestAdminTransfer } from "../../../services/study-groups/src/application/use-cases/RequestAdminTransfer.js";
import { AcceptAdminTransfer } from "../../../services/study-groups/src/application/use-cases/AcceptAdminTransfer.js";
import type { IAdminTransferRepository } from "../../../services/study-groups/src/domain/repositories/IAdminTransferRepository.js";
import type { IStudyGroupRepository } from "../../../services/study-groups/src/domain/repositories/IStudyGroupRepository.js";
import type { AdminTransfer } from "../../../services/study-groups/src/domain/entities/AdminTransfer.js";
import type { StudyGroupSubject } from "../../../services/study-groups/src/domain/events/index.js";
import { AbiertaState } from "../../../services/study-groups/src/domain/states/AbiertaState.js";
import { CerradaState } from "../../../services/study-groups/src/domain/states/CerradaState.js";
import { TransferenciaPendienteState } from "../../../services/study-groups/src/domain/states/TransferenciaPendienteState.js";
import { StudyGroup } from "../../../services/study-groups/src/domain/states/StudyGroup.js";
import type { ISubject } from "../../../services/study-groups/src/domain/events/observers/ISubject.js";
import { InvalidStateTransitionError } from "../../../shared/libs/errors/InvalidStateTransitionError.js";
import { NotFoundError } from "../../../shared/libs/errors/NotFoundError.js";

// ---------------------------------------------------------------------------
// Mock refs — keep a reference to each mock.fn() so we can read .mock.calls
// ---------------------------------------------------------------------------

interface MockRefs {
  getById: ReturnType<typeof mock.fn>;
  requestTransfer: ReturnType<typeof mock.fn>;
  acceptTransfer: ReturnType<typeof mock.fn>;
  leaveAdminRole: ReturnType<typeof mock.fn>;
  emit: ReturnType<typeof mock.fn>;
  loadStudyGroup: ReturnType<typeof mock.fn>;
}

function createMockRefs(): MockRefs {
  return {
    getById: mock.fn(),
    requestTransfer: mock.fn(),
    acceptTransfer: mock.fn(),
    leaveAdminRole: mock.fn(),
    emit: mock.fn(),
    loadStudyGroup: mock.fn(),
  };
}

function buildRepository(refs: MockRefs): IAdminTransferRepository {
  return {
    getById: refs.getById as unknown as IAdminTransferRepository["getById"],
    requestTransfer: refs.requestTransfer as unknown as IAdminTransferRepository["requestTransfer"],
    acceptTransfer: refs.acceptTransfer as unknown as IAdminTransferRepository["acceptTransfer"],
    leaveAdminRole: refs.leaveAdminRole as unknown as IAdminTransferRepository["leaveAdminRole"],
  };
}

function buildSubject(refs: MockRefs): StudyGroupSubject {
  return {
    observers: new Set(),
    name: "mock",
    emit: refs.emit,
    subscribe: mock.fn(),
    unsubscribe: mock.fn(),
    getObserverCount: mock.fn(() => 0),
    clear: mock.fn(),
  } as unknown as StudyGroupSubject;
}

function buildStudyGroupRepo(refs: MockRefs): IStudyGroupRepository {
  return {
    loadStudyGroup: refs.loadStudyGroup as unknown as IStudyGroupRepository["loadStudyGroup"],
  };
}

// ---------------------------------------------------------------------------
// RequestAdminTransfer (Integration)
// ---------------------------------------------------------------------------

describe("RequestAdminTransfer (Integration)", () => {
  it("emite el evento correcto tras una transferencia exitosa", async () => {
    const refs = createMockRefs();
    const mockSubject = buildSubject(refs);
    const mockRepository = buildRepository(refs);
    const mockStudyGroupRepository = buildStudyGroupRepo(refs);

    const validationGroup = new StudyGroup("group-1", "Test Group", 5, 3, new AbiertaState(), { emit: async () => {}, subscribe: () => {}, unsubscribe: () => {} });
    const mockStudyGroup = new StudyGroup("group-1", "Test Group", 5, 3, new AbiertaState(), mockSubject);
    // First loadStudyGroup call uses a noOpSubject (validation), second uses mockSubject
    const noOpSubject: ISubject = { emit: async () => {}, subscribe: () => {}, unsubscribe: () => {} };
    refs.loadStudyGroup.mock.mockImplementation(async (_id: string, subject: ISubject) => {
      return subject === mockSubject ? mockStudyGroup : validationGroup;
    });

    const mockTransfer: AdminTransfer = {
      id: "transfer-1",
      requestId: "group-1",
      fromUserId: "admin-old",
      toUserId: "admin-new",
      status: "pendiente",
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };
    refs.requestTransfer.mock.mockImplementation(async () => mockTransfer);

    const useCase = new RequestAdminTransfer(mockRepository, mockStudyGroupRepository, mockSubject);

    await useCase.execute({
      requestId: "group-1",
      actorUserId: "admin-old",
      targetUserId: "admin-new",
    });

    assert.strictEqual(refs.emit.mock.calls.length, 1);
    const emittedEvent = refs.emit.mock.calls[0].arguments[0] as Record<string, unknown>;
    assert.strictEqual(emittedEvent.type, "TRANSFERENCIA_ADMIN_SOLICITADA");
    assert.strictEqual(emittedEvent.transferId, "transfer-1");
    assert.strictEqual(emittedEvent.groupId, "group-1");
    assert.strictEqual(emittedEvent.oldAdminId, "admin-old");
    assert.strictEqual(emittedEvent.newAdminId, "admin-new");
    assert.strictEqual(emittedEvent.currentState, "abierta");
    assert.strictEqual(emittedEvent.groupName, "Test Group");

    assert.strictEqual(refs.requestTransfer.mock.calls.length, 1);
  });

  it("lanza error al pedir transferencia en estado prohibido (Cerrada)", async () => {
    const refs = createMockRefs();
    const mockSubject = buildSubject(refs);
    const mockRepository = buildRepository(refs);
    const mockStudyGroupRepository = buildStudyGroupRepo(refs);

    const mockClosedGroup = new StudyGroup("group-closed", "Closed Group", 5, 3, new CerradaState(), mockSubject);
    refs.loadStudyGroup.mock.mockImplementation(async () => mockClosedGroup);

    const useCase = new RequestAdminTransfer(mockRepository, mockStudyGroupRepository, mockSubject);

    await assert.rejects(
      () => useCase.execute({ requestId: "group-closed", actorUserId: "admin-old", targetUserId: "admin-new" }),
      InvalidStateTransitionError,
    );

    assert.strictEqual(refs.requestTransfer.mock.calls.length, 0);
  });

  it("no persiste ni emite si la validacion de estado falla", async () => {
    const refs = createMockRefs();
    const mockSubject = buildSubject(refs);
    const mockRepository = buildRepository(refs);
    const mockStudyGroupRepository = buildStudyGroupRepo(refs);

    const pendingState = new TransferenciaPendienteState(new AbiertaState());
    const mockPendingGroup = new StudyGroup("group-pending", "Pending Transfer Group", 5, 3, pendingState, mockSubject);
    refs.loadStudyGroup.mock.mockImplementation(async () => mockPendingGroup);

    const useCase = new RequestAdminTransfer(mockRepository, mockStudyGroupRepository, mockSubject);

    await assert.rejects(
      () => useCase.execute({ requestId: "group-pending", actorUserId: "admin-old", targetUserId: "admin-new" }),
      InvalidStateTransitionError,
    );

    assert.strictEqual(refs.requestTransfer.mock.calls.length, 0);
  });

  it("retorna el objeto AdminTransfer persistido", async () => {
    const refs = createMockRefs();
    const mockSubject = buildSubject(refs);
    const mockRepository = buildRepository(refs);
    const mockStudyGroupRepository = buildStudyGroupRepo(refs);

    const mockStudyGroup = new StudyGroup("group-1", "Test Group", 5, 3, new AbiertaState(), mockSubject);
    refs.loadStudyGroup.mock.mockImplementation(async () => mockStudyGroup);

    const mockTransfer: AdminTransfer = {
      id: "transfer-uuid",
      requestId: "group-1",
      fromUserId: "admin-old",
      toUserId: "admin-new",
      status: "pendiente",
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };
    refs.requestTransfer.mock.mockImplementation(async () => mockTransfer);

    const useCase = new RequestAdminTransfer(mockRepository, mockStudyGroupRepository, mockSubject);

    const result = await useCase.execute({
      requestId: "group-1",
      actorUserId: "admin-old",
      targetUserId: "admin-new",
    });

    assert.deepStrictEqual(result, mockTransfer);
  });
});

// ---------------------------------------------------------------------------
// AcceptAdminTransfer (Integration)
// ---------------------------------------------------------------------------

describe("AcceptAdminTransfer (Integration)", () => {
  it("emite el evento correcto tras aceptacion exitosa", async () => {
    const refs = createMockRefs();
    const mockSubject = buildSubject(refs);
    const mockRepository = buildRepository(refs);
    const mockStudyGroupRepository = buildStudyGroupRepo(refs);

    const pendingState = new TransferenciaPendienteState(new AbiertaState());
    const mockPendingGroup = new StudyGroup("group-1", "Test Group", 5, 3, pendingState, mockSubject);
    refs.loadStudyGroup.mock.mockImplementation(async () => mockPendingGroup);

    const mockTransfer: AdminTransfer = {
      id: "transfer-1",
      requestId: "group-1",
      fromUserId: "admin-old",
      toUserId: "admin-new",
      status: "pendiente",
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };
    refs.getById.mock.mockImplementation(async () => mockTransfer);

    const useCase = new AcceptAdminTransfer(mockRepository, mockStudyGroupRepository, mockSubject);

    await useCase.execute({ transferId: "transfer-1", actorUserId: "admin-new" });

    assert.strictEqual(refs.emit.mock.calls.length, 1);
    const emittedEvent = refs.emit.mock.calls[0].arguments[0] as Record<string, unknown>;
    assert.strictEqual(emittedEvent.type, "TRANSFERENCIA_ADMIN_ACEPTADA");
    assert.strictEqual(emittedEvent.transferId, "transfer-1");
    assert.strictEqual(emittedEvent.groupId, "group-1");
    assert.strictEqual(emittedEvent.oldAdminId, "admin-old");
    assert.strictEqual(emittedEvent.newAdminId, "admin-new");
    assert.strictEqual(emittedEvent.newState, "abierta");
    assert.strictEqual(emittedEvent.acceptedBy, "admin-new");

    assert.strictEqual(refs.acceptTransfer.mock.calls.length, 1);
  });

  it("lanza NotFoundError si la transferencia no existe", async () => {
    const refs = createMockRefs();
    const mockSubject = buildSubject(refs);
    const mockRepository = buildRepository(refs);
    const mockStudyGroupRepository = buildStudyGroupRepo(refs);
    refs.getById.mock.mockImplementation(async () => null);

    const useCase = new AcceptAdminTransfer(mockRepository, mockStudyGroupRepository, mockSubject);

    await assert.rejects(
      () => useCase.execute({ transferId: "nonexistent", actorUserId: "admin-new" }),
      NotFoundError,
    );

    assert.strictEqual(refs.acceptTransfer.mock.calls.length, 0);
  });

  it("lanza error al aceptar en estado prohibido (no hay transferencia pendiente)", async () => {
    const refs = createMockRefs();
    const mockSubject = buildSubject(refs);
    const mockRepository = buildRepository(refs);
    const mockStudyGroupRepository = buildStudyGroupRepo(refs);

    const mockAbiertaGroup = new StudyGroup("group-1", "Test Group", 5, 3, new AbiertaState(), mockSubject);
    refs.loadStudyGroup.mock.mockImplementation(async () => mockAbiertaGroup);

    const mockTransfer: AdminTransfer = {
      id: "transfer-1",
      requestId: "group-1",
      fromUserId: "admin-old",
      toUserId: "admin-new",
      status: "pendiente",
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };
    refs.getById.mock.mockImplementation(async () => mockTransfer);

    const useCase = new AcceptAdminTransfer(mockRepository, mockStudyGroupRepository, mockSubject);

    await assert.rejects(
      () => useCase.execute({ transferId: "transfer-1", actorUserId: "admin-new" }),
      InvalidStateTransitionError,
    );

    assert.strictEqual(refs.acceptTransfer.mock.calls.length, 0);
  });

  it("no persiste si la emision del evento falla", async () => {
    const refs = createMockRefs();
    const mockRepository = buildRepository(refs);
    const mockStudyGroupRepository = buildStudyGroupRepo(refs);

    const emitRef = mock.fn(async () => { throw new Error("Event emission failed"); });

    const failingSubject: StudyGroupSubject = {
      observers: new Set(),
      name: "failing",
      emit: emitRef,
      subscribe: mock.fn(),
      unsubscribe: mock.fn(),
      getObserverCount: mock.fn(() => 0),
      clear: mock.fn(),
    } as unknown as StudyGroupSubject;

    const pendingState = new TransferenciaPendienteState(new AbiertaState());
    const mockPendingGroup = new StudyGroup("group-1", "Test Group", 5, 3, pendingState, failingSubject);
    refs.loadStudyGroup.mock.mockImplementation(async () => mockPendingGroup);

    const mockTransfer: AdminTransfer = {
      id: "transfer-1",
      requestId: "group-1",
      fromUserId: "admin-old",
      toUserId: "admin-new",
      status: "pendiente",
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };
    refs.getById.mock.mockImplementation(async () => mockTransfer);

    const useCase = new AcceptAdminTransfer(mockRepository, mockStudyGroupRepository, failingSubject);

    await assert.rejects(
      () => useCase.execute({ transferId: "transfer-1", actorUserId: "admin-new" }),
      Error,
    );

    assert.strictEqual(refs.acceptTransfer.mock.calls.length, 0);
  });
});
