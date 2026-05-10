import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { RequestAdminTransfer } from "../../../services/study-groups/src/application/use-cases/RequestAdminTransfer.js";
import { AcceptAdminTransfer } from "../../../services/study-groups/src/application/use-cases/AcceptAdminTransfer.js";
import type { IAdminTransferRepository } from "../../../services/study-groups/src/domain/repositories/IAdminTransferRepository.js";
import type { IStudyGroupRepository } from "../../../services/study-groups/src/domain/repositories/IStudyGroupRepository.js";
import type { AdminTransfer } from "../../../services/study-groups/src/domain/entities/AdminTransfer.js";
import { AbiertaState } from "../../../services/study-groups/src/domain/states/AbiertaState.js";
import { CerradaState } from "../../../services/study-groups/src/domain/states/CerradaState.js";
import { TransferenciaPendienteState } from "../../../services/study-groups/src/domain/states/TransferenciaPendienteState.js";
import { StudyGroup } from "../../../services/study-groups/src/domain/states/StudyGroup.js";
import type { ISubject } from "../../../services/study-groups/src/domain/events/observers/ISubject.js";
import { InvalidStateTransitionError } from "../../../shared/libs/errors/InvalidStateTransitionError.js";
import { NotFoundError } from "../../../shared/libs/errors/NotFoundError.js";

const createMockRepository = (): IAdminTransferRepository => ({
  getById: mock.fn(),
  requestTransfer: mock.fn(),
  acceptTransfer: mock.fn(),
  leaveAdminRole: mock.fn(),
});

const createMockStudyGroupRepository = (): IStudyGroupRepository => ({
  loadStudyGroup: mock.fn(),
});

const createMockSubject = (): ISubject => ({
  subscribe: mock.fn(),
  unsubscribe: mock.fn(),
  emit: mock.fn(async () => {}),
});

describe("RequestAdminTransfer (Integration)", () => {
  it("emite el evento correcto tras una transferencia exitosa", async () => {
    const mockStudyGroup = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      3,
      new AbiertaState(),
      createMockSubject(),
    );

    const mockTransfer: AdminTransfer = {
      id: "transfer-1",
      requestId: "group-1",
      fromUserId: "admin-old",
      toUserId: "admin-new",
      status: "pendiente",
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };

    const mockRepository: IAdminTransferRepository = {
      getById: mock.fn(),
      requestTransfer: mock.fn(async () => mockTransfer),
      acceptTransfer: mock.fn(),
      leaveAdminRole: mock.fn(),
    };

    const mockStudyGroupRepository: IStudyGroupRepository = {
      loadStudyGroup: mock.fn(async () => mockStudyGroup),
    };

    const mockSubject = mockStudyGroup.getSubject?.() || createMockSubject();

    const useCase = new RequestAdminTransfer(
      mockRepository,
      mockStudyGroupRepository,
      mockSubject,
    );

    await useCase.execute({
      requestId: "group-1",
      actorUserId: "admin-old",
      targetUserId: "admin-new",
    });

    // Validar que emit fue llamado
    assert.strictEqual(mockSubject.emit.mock.calls.length, 1);
    const emittedEvent = mockSubject.emit.mock.calls[0].arguments[0];
    assert.strictEqual(emittedEvent.type, "TRANSFERENCIA_ADMIN_SOLICITADA");
    assert.strictEqual(emittedEvent.transferId, "transfer-1");
    assert.strictEqual(emittedEvent.groupId, "group-1");
    assert.strictEqual(emittedEvent.oldAdminId, "admin-old");
    assert.strictEqual(emittedEvent.newAdminId, "admin-new");
    assert.strictEqual(emittedEvent.currentState, "abierta");
    assert.strictEqual(emittedEvent.groupName, "Test Group");

    // Validar que requestTransfer fue llamado
    assert.strictEqual(mockRepository.requestTransfer.mock.calls.length, 1);
  });

  it("lanza error al pedir transferencia en estado prohibido (Cerrada)", async () => {
    const mockSubject = createMockSubject();
    const mockClosedGroup = new StudyGroup(
      "group-closed",
      "Closed Group",
      5,
      3,
      new CerradaState(),
      mockSubject,
    );

    const mockRepository: IAdminTransferRepository = {
      getById: mock.fn(),
      requestTransfer: mock.fn(),
      acceptTransfer: mock.fn(),
      leaveAdminRole: mock.fn(),
    };

    const mockStudyGroupRepository: IStudyGroupRepository = {
      loadStudyGroup: mock.fn(async () => mockClosedGroup),
    };

    const useCase = new RequestAdminTransfer(
      mockRepository,
      mockStudyGroupRepository,
      mockSubject,
    );

    await assert.rejects(
      () =>
        useCase.execute({
          requestId: "group-closed",
          actorUserId: "admin-old",
          targetUserId: "admin-new",
        }),
      InvalidStateTransitionError,
    );

    // Validar que no se llamó a requestTransfer
    assert.strictEqual(mockRepository.requestTransfer.mock.calls.length, 0);
  });

  it("no persiste ni emite si la validación de estado falla", async () => {
    const mockSubject = createMockSubject();
    const baseState = new AbiertaState();
    const pendingState = new TransferenciaPendienteState(baseState);
    const mockPendingGroup = new StudyGroup(
      "group-pending",
      "Pending Transfer Group",
      5,
      3,
      pendingState,
      mockSubject,
    );

    const mockRepository: IAdminTransferRepository = {
      getById: mock.fn(),
      requestTransfer: mock.fn(),
      acceptTransfer: mock.fn(),
      leaveAdminRole: mock.fn(),
    };

    const mockStudyGroupRepository: IStudyGroupRepository = {
      loadStudyGroup: mock.fn(async () => mockPendingGroup),
    };

    const useCase = new RequestAdminTransfer(
      mockRepository,
      mockStudyGroupRepository,
      mockSubject,
    );

    await assert.rejects(
      () =>
        useCase.execute({
          requestId: "group-pending",
          actorUserId: "admin-old",
          targetUserId: "admin-new",
        }),
      InvalidStateTransitionError,
    );

    // Validar que no se persistió
    assert.strictEqual(mockRepository.requestTransfer.mock.calls.length, 0);
  });

  it("retorna el objeto AdminTransfer persistido", async () => {
    const mockSubject = createMockSubject();
    const mockStudyGroup = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      3,
      new AbiertaState(),
      mockSubject,
    );

    const mockTransfer: AdminTransfer = {
      id: "transfer-uuid",
      requestId: "group-1",
      fromUserId: "admin-old",
      toUserId: "admin-new",
      status: "pendiente",
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };

    const mockRepository: IAdminTransferRepository = {
      getById: mock.fn(),
      requestTransfer: mock.fn(async () => mockTransfer),
      acceptTransfer: mock.fn(),
      leaveAdminRole: mock.fn(),
    };

    const mockStudyGroupRepository: IStudyGroupRepository = {
      loadStudyGroup: mock.fn(async () => mockStudyGroup),
    };

    const useCase = new RequestAdminTransfer(
      mockRepository,
      mockStudyGroupRepository,
      mockSubject,
    );

    const result = await useCase.execute({
      requestId: "group-1",
      actorUserId: "admin-old",
      targetUserId: "admin-new",
    });

    assert.deepStrictEqual(result, mockTransfer);
  });
});

describe("AcceptAdminTransfer (Integration)", () => {
  it("emite el evento correcto tras aceptación exitosa", async () => {
    const mockSubject = createMockSubject();
    const baseState = new AbiertaState();
    const pendingState = new TransferenciaPendienteState(baseState);
    const mockPendingGroup = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      3,
      pendingState,
      mockSubject,
    );

    const mockTransfer: AdminTransfer = {
      id: "transfer-1",
      requestId: "group-1",
      fromUserId: "admin-old",
      toUserId: "admin-new",
      status: "pendiente",
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };

    const mockRepository: IAdminTransferRepository = {
      getById: mock.fn(async () => mockTransfer),
      requestTransfer: mock.fn(),
      acceptTransfer: mock.fn(),
      leaveAdminRole: mock.fn(),
    };

    const mockStudyGroupRepository: IStudyGroupRepository = {
      loadStudyGroup: mock.fn(async () => mockPendingGroup),
    };

    const useCase = new AcceptAdminTransfer(
      mockRepository,
      mockStudyGroupRepository,
      mockSubject,
    );

    await useCase.execute({
      transferId: "transfer-1",
      actorUserId: "admin-new",
    });

    // Validar que emit fue llamado
    assert.strictEqual(mockSubject.emit.mock.calls.length, 1);
    const emittedEvent = mockSubject.emit.mock.calls[0].arguments[0];
    assert.strictEqual(emittedEvent.type, "TRANSFERENCIA_ADMIN_ACEPTADA");
    assert.strictEqual(emittedEvent.transferId, "transfer-1");
    assert.strictEqual(emittedEvent.groupId, "group-1");
    assert.strictEqual(emittedEvent.oldAdminId, "admin-old");
    assert.strictEqual(emittedEvent.newAdminId, "admin-new");
    assert.strictEqual(emittedEvent.newState, "abierta");
    assert.strictEqual(emittedEvent.acceptedBy, "admin-new");

    // Validar que acceptTransfer fue llamado
    assert.strictEqual(mockRepository.acceptTransfer.mock.calls.length, 1);
  });

  it("lanza NotFoundError si la transferencia no existe", async () => {
    const mockSubject = createMockSubject();

    const mockRepository: IAdminTransferRepository = {
      getById: mock.fn(async () => null),
      requestTransfer: mock.fn(),
      acceptTransfer: mock.fn(),
      leaveAdminRole: mock.fn(),
    };

    const mockStudyGroupRepository: IStudyGroupRepository = {
      loadStudyGroup: mock.fn(),
    };

    const useCase = new AcceptAdminTransfer(
      mockRepository,
      mockStudyGroupRepository,
      mockSubject,
    );

    await assert.rejects(
      () =>
        useCase.execute({
          transferId: "nonexistent",
          actorUserId: "admin-new",
        }),
      NotFoundError,
    );

    // Validar que no se persistió
    assert.strictEqual(mockRepository.acceptTransfer.mock.calls.length, 0);
  });

  it("lanza error al aceptar en estado prohibido (no hay transferencia pendiente)", async () => {
    const mockSubject = createMockSubject();
    // El grupo está en estado Abierta (sin transferencia pendiente)
    const mockAbiertaGroup = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      3,
      new AbiertaState(),
      mockSubject,
    );

    const mockTransfer: AdminTransfer = {
      id: "transfer-1",
      requestId: "group-1",
      fromUserId: "admin-old",
      toUserId: "admin-new",
      status: "pendiente",
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };

    const mockRepository: IAdminTransferRepository = {
      getById: mock.fn(async () => mockTransfer),
      requestTransfer: mock.fn(),
      acceptTransfer: mock.fn(),
      leaveAdminRole: mock.fn(),
    };

    const mockStudyGroupRepository: IStudyGroupRepository = {
      loadStudyGroup: mock.fn(async () => mockAbiertaGroup),
    };

    const useCase = new AcceptAdminTransfer(
      mockRepository,
      mockStudyGroupRepository,
      mockSubject,
    );

    await assert.rejects(
      () =>
        useCase.execute({
          transferId: "transfer-1",
          actorUserId: "admin-new",
        }),
      InvalidStateTransitionError,
    );

    // Validar que no se persistió
    assert.strictEqual(mockRepository.acceptTransfer.mock.calls.length, 0);
  });

  it("no persiste si la emisión del evento falla", async () => {
    // Mock el subject para que lance un error
    const failingSubject: ISubject = {
      emit: mock.fn(async () => {
        throw new Error("Event emission failed");
      }),
      subscribe: mock.fn(),
      unsubscribe: mock.fn(),
    };

    const baseState = new AbiertaState();
    const pendingState = new TransferenciaPendienteState(baseState);
    const mockPendingGroup = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      3,
      pendingState,
      failingSubject,
    );

    const mockTransfer: AdminTransfer = {
      id: "transfer-1",
      requestId: "group-1",
      fromUserId: "admin-old",
      toUserId: "admin-new",
      status: "pendiente",
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };

    const mockRepository: IAdminTransferRepository = {
      getById: mock.fn(async () => mockTransfer),
      requestTransfer: mock.fn(),
      acceptTransfer: mock.fn(),
      leaveAdminRole: mock.fn(),
    };

    const mockStudyGroupRepository: IStudyGroupRepository = {
      loadStudyGroup: mock.fn(async () => mockPendingGroup),
    };

    const useCase = new AcceptAdminTransfer(
      mockRepository,
      mockStudyGroupRepository,
      failingSubject,
    );

    await assert.rejects(
      () =>
        useCase.execute({
          transferId: "transfer-1",
          actorUserId: "admin-new",
        }),
      Error,
    );

    // Validar que no se persistió
    assert.strictEqual(mockRepository.acceptTransfer.mock.calls.length, 0);
  });
});

