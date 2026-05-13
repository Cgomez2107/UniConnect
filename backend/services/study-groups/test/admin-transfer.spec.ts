import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { RequestAdminTransfer } from "../src/application/use-cases/RequestAdminTransfer.js";
import { AcceptAdminTransfer } from "../src/application/use-cases/AcceptAdminTransfer.js";
import type { IAdminTransferRepository } from "../src/domain/repositories/IAdminTransferRepository.js";
import type { IStudyGroupRepository } from "../src/domain/repositories/IStudyGroupRepository.js";
import type { IStudyGroupState } from "../src/domain/states/IStudyGroupState.js";
import type { AdminTransfer } from "../src/domain/entities/AdminTransfer.js";
import type { StudyGroupSubject } from "../src/domain/events/index.js";
import type { ISubject } from "../src/domain/events/observers/ISubject.js";
import { AbiertaState } from "../src/domain/states/AbiertaState.js";
import { StudyGroup } from "../src/domain/states/StudyGroup.js";
import { InvalidStateTransitionError } from "../../../shared/libs/errors/InvalidStateTransitionError.js";
import { NotFoundError } from "../../../shared/libs/errors/NotFoundError.js";

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const BASE_GROUP_PROPS: ISubject = { emit: async () => {}, subscribe: () => {}, unsubscribe: () => {} };

const MOCK_TRANSFER: AdminTransfer = {
  id: "transfer-1",
  requestId: "group-1",
  fromUserId: "admin-old",
  toUserId: "admin-new",
  status: "pendiente",
  createdAt: new Date().toISOString(),
  respondedAt: null,
};

// ---------------------------------------------------------------------------
// Factory functions — plain jest.fn() objects cast via unknown.
// Do NOT chain .mockResolvedValue() here — use jest.mocked() in beforeEach.
// ---------------------------------------------------------------------------

function createMockRepository(): IAdminTransferRepository {
  return {
    getById: jest.fn(),
    requestTransfer: jest.fn(),
    acceptTransfer: jest.fn(),
    leaveAdminRole: jest.fn(),
  } as unknown as IAdminTransferRepository;
}

function createMockSubject(): StudyGroupSubject {
  return {
    observers: new Set(),
    name: "mock-subject",
    emit: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    getObserverCount: jest.fn(),
    clear: jest.fn(),
  } as unknown as StudyGroupSubject;
}

function createMockStudyGroupRepo(): IStudyGroupRepository {
  return {
    loadStudyGroup: jest.fn(),
  } as unknown as IStudyGroupRepository;
}

// ---------------------------------------------------------------------------
// RequestAdminTransfer
// ---------------------------------------------------------------------------

describe("RequestAdminTransfer", () => {
  let mockRepository: IAdminTransferRepository;
  let mockSubject: StudyGroupSubject;
  let mockStudyGroupRepository: IStudyGroupRepository;
  let useCase: RequestAdminTransfer;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = createMockRepository();
    mockSubject = createMockSubject();
    mockStudyGroupRepository = createMockStudyGroupRepo();

    const mockStudyGroup = new StudyGroup("group-1", "Test Group", 5, 3, new AbiertaState(), BASE_GROUP_PROPS);
    jest.mocked(mockStudyGroupRepository).loadStudyGroup.mockResolvedValue(mockStudyGroup);

    useCase = new RequestAdminTransfer(mockRepository, mockStudyGroupRepository, mockSubject);
  });

  it("emite evento TRANSFERENCIA_ADMIN_SOLICITADA tras persistir", async () => {
    jest.mocked(mockRepository).requestTransfer.mockResolvedValue(MOCK_TRANSFER);

    const result = await useCase.execute({
      requestId: "group-1",
      actorUserId: "admin-old",
      targetUserId: "admin-new",
    });

    expect(result).toEqual(MOCK_TRANSFER);

    expect(jest.mocked(mockRepository).requestTransfer).toHaveBeenCalledTimes(1);
    expect(jest.mocked(mockRepository).requestTransfer).toHaveBeenCalledWith({
      requestId: "group-1",
      actorUserId: "admin-old",
      targetUserId: "admin-new",
    });

    expect(jest.mocked(mockSubject).emit).toHaveBeenCalledTimes(1);
    expect(jest.mocked(mockSubject).emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "TRANSFERENCIA_ADMIN_SOLICITADA",
        transferId: "transfer-1",
        groupId: "group-1",
        oldAdminId: "admin-old",
        newAdminId: "admin-new",
        currentState: "abierta",
        groupName: "Test Group",
      }),
    );
  });

  it("lanza InvalidStateTransitionError si el grupo esta Cerrada", async () => {
    const { CerradaState } = await import("../src/domain/states/CerradaState.js");
    const closedGroup = new StudyGroup("group-closed", "Closed Group", 5, 3, new CerradaState(), BASE_GROUP_PROPS);
    jest.mocked(mockStudyGroupRepository).loadStudyGroup.mockResolvedValue(closedGroup);

    await expect(
      useCase.execute({ requestId: "group-closed", actorUserId: "admin-old", targetUserId: "admin-new" }),
    ).rejects.toThrow(InvalidStateTransitionError);

    expect(jest.mocked(mockRepository).requestTransfer).not.toHaveBeenCalled();
    expect(jest.mocked(mockSubject).emit).not.toHaveBeenCalled();
  });

  it("lanza InvalidStateTransitionError si ya hay una transferencia pendiente", async () => {
    const { TransferenciaPendienteState } = await import("../src/domain/states/TransferenciaPendienteState.js");
    const pendingGroup = new StudyGroup("group-pending", "Pending Group", 5, 3, new TransferenciaPendienteState(new AbiertaState()), BASE_GROUP_PROPS);
    jest.mocked(mockStudyGroupRepository).loadStudyGroup.mockResolvedValue(pendingGroup);

    await expect(
      useCase.execute({ requestId: "group-pending", actorUserId: "admin-old", targetUserId: "admin-new" }),
    ).rejects.toThrow(InvalidStateTransitionError);

    expect(jest.mocked(mockRepository).requestTransfer).not.toHaveBeenCalled();
  });

  it("no persiste ni emite si la validacion de estado falla", async () => {
    const { CerradaState } = await import("../src/domain/states/CerradaState.js");
    const closedGroup = new StudyGroup("group-closed", "Closed", 5, 3, new CerradaState(), BASE_GROUP_PROPS);
    jest.mocked(mockStudyGroupRepository).loadStudyGroup.mockResolvedValue(closedGroup);

    await expect(
      useCase.execute({ requestId: "group-closed", actorUserId: "admin-old", targetUserId: "admin-new" }),
    ).rejects.toThrow(InvalidStateTransitionError);

    expect(jest.mocked(mockRepository).requestTransfer).not.toHaveBeenCalled();
    expect(jest.mocked(mockSubject).emit).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AcceptAdminTransfer
// ---------------------------------------------------------------------------

describe("AcceptAdminTransfer", () => {
  let mockRepository: IAdminTransferRepository;
  let mockSubject: StudyGroupSubject;
  let mockStudyGroupRepository: IStudyGroupRepository;
  let useCase: AcceptAdminTransfer;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = createMockRepository();
    mockSubject = createMockSubject();
    mockStudyGroupRepository = createMockStudyGroupRepo();

    const mockStudyGroup = new StudyGroup("group-1", "Test Group", 5, 3, new AbiertaState(), BASE_GROUP_PROPS);
    jest.mocked(mockStudyGroupRepository).loadStudyGroup.mockResolvedValue(mockStudyGroup);

    useCase = new AcceptAdminTransfer(mockRepository, mockStudyGroupRepository, mockSubject);
  });

  it("emite evento TRANSFERENCIA_ADMIN_ACEPTADA tras aceptar y persiste", async () => {
    jest.mocked(mockRepository).getById.mockResolvedValue(MOCK_TRANSFER);

    const { TransferenciaPendienteState } = await import("../src/domain/states/TransferenciaPendienteState.js");
    const pendingGroup = new StudyGroup("group-1", "Test Group", 5, 3, new TransferenciaPendienteState(new AbiertaState()), mockSubject);
    jest.mocked(mockStudyGroupRepository).loadStudyGroup.mockResolvedValue(pendingGroup);

    await useCase.execute({ transferId: "transfer-1", actorUserId: "admin-new" });

    expect(jest.mocked(mockSubject).emit).toHaveBeenCalledTimes(1);
    expect(jest.mocked(mockSubject).emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "TRANSFERENCIA_ADMIN_ACEPTADA",
        transferId: "transfer-1",
        groupId: "group-1",
        oldAdminId: "admin-old",
        newAdminId: "admin-new",
        newState: "abierta",
        acceptedBy: "admin-new",
      }),
    );

    expect(jest.mocked(mockRepository).acceptTransfer).toHaveBeenCalledTimes(1);
    expect(jest.mocked(mockRepository).acceptTransfer).toHaveBeenCalledWith({
      transferId: "transfer-1",
      actorUserId: "admin-new",
    });
  });

  it("lanza NotFoundError si la transferencia no existe", async () => {
    jest.mocked(mockRepository).getById.mockResolvedValue(null);

    await expect(
      useCase.execute({ transferId: "nonexistent", actorUserId: "admin-new" }),
    ).rejects.toThrow(NotFoundError);

    expect(jest.mocked(mockRepository).acceptTransfer).not.toHaveBeenCalled();
    expect(jest.mocked(mockSubject).emit).not.toHaveBeenCalled();
  });

  it("lanza InvalidStateTransitionError si el grupo no esta en estado de transferencia pendiente", async () => {
    jest.mocked(mockRepository).getById.mockResolvedValue(MOCK_TRANSFER);

    await expect(
      useCase.execute({ transferId: "transfer-1", actorUserId: "admin-new" }),
    ).rejects.toThrow(InvalidStateTransitionError);

    expect(jest.mocked(mockRepository).acceptTransfer).not.toHaveBeenCalled();
  });

  it("no persiste si la emision del evento falla", async () => {
    jest.mocked(mockRepository).getById.mockResolvedValue(MOCK_TRANSFER);

    const failingSubject: StudyGroupSubject = {
      observers: new Set(),
      name: "failing-subject",
      emit: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      getObserverCount: jest.fn().mockReturnValue(0),
      clear: jest.fn(),
    } as unknown as StudyGroupSubject;
    jest.mocked(failingSubject).emit.mockRejectedValue(new Error("Event emission failed"));

    const { TransferenciaPendienteState } = await import("../src/domain/states/TransferenciaPendienteState.js");
    const pendingGroup = new StudyGroup("group-1", "Test Group", 5, 3, new TransferenciaPendienteState(new AbiertaState()), failingSubject);
    jest.mocked(mockStudyGroupRepository).loadStudyGroup.mockResolvedValue(pendingGroup);

    await expect(
      useCase.execute({ transferId: "transfer-1", actorUserId: "admin-new" }),
    ).rejects.toThrow("Event emission failed");

    expect(jest.mocked(mockRepository).acceptTransfer).not.toHaveBeenCalled();
  });
});
