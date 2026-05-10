import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { RequestAdminTransfer } from "../../src/application/use-cases/RequestAdminTransfer.js";
import { AcceptAdminTransfer } from "../../src/application/use-cases/AcceptAdminTransfer.js";
import type { IAdminTransferRepository } from "../../src/domain/repositories/IAdminTransferRepository.js";
import type { IStudyGroupRepository } from "../../src/domain/repositories/IStudyGroupRepository.js";
import type { StudyGroupSubject } from "../../src/domain/events/index.js";
import type { AdminTransfer } from "../../src/domain/entities/AdminTransfer.js";
import { AbiertaState } from "../../src/domain/states/AbiertaState.js";
import { StudyGroup } from "../../src/domain/states/StudyGroup.js";
import type { ISubject } from "../../src/domain/events/observers/ISubject.js";
import { InvalidStateTransitionError } from "../../../../../shared/libs/errors/InvalidStateTransitionError.js";
import { NotFoundError } from "../../../../../shared/libs/errors/NotFoundError.js";

describe("RequestAdminTransfer (Integration)", () => {
  let mockRepository: jest.Mocked<IAdminTransferRepository>;
  let mockStudyGroupRepository: jest.Mocked<IStudyGroupRepository>;
  let mockSubject: jest.Mocked<ISubject>;
  let useCase: RequestAdminTransfer;

  beforeEach(() => {
    mockRepository = {
      getById: jest.fn(),
      requestTransfer: jest.fn(),
      acceptTransfer: jest.fn(),
      leaveAdminRole: jest.fn(),
    };

    const mockStudyGroup = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      3,
      new AbiertaState(),
      { emit: async () => {}, subscribe: () => {}, unsubscribe: () => {} },
    );

    mockStudyGroupRepository = {
      loadStudyGroup: jest.fn().mockResolvedValue(mockStudyGroup),
    };

    mockSubject = {
      emit: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };

    useCase = new RequestAdminTransfer(
      mockRepository,
      mockStudyGroupRepository,
      mockSubject as any,
    );
  });

  it("emite el evento correcto tras una transferencia exitosa", async () => {
    const mockTransfer: AdminTransfer = {
      id: "transfer-1",
      requestId: "group-1",
      fromUserId: "admin-old",
      toUserId: "admin-new",
      status: "pendiente",
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };

    mockRepository.requestTransfer.mockResolvedValue(mockTransfer);

    await useCase.execute({
      requestId: "group-1",
      actorUserId: "admin-old",
      targetUserId: "admin-new",
    });

    expect(mockSubject.emit).toHaveBeenCalledTimes(1);
    expect(mockSubject.emit).toHaveBeenCalledWith(
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

    expect(mockRepository.requestTransfer).toHaveBeenCalledTimes(1);
    expect(mockRepository.requestTransfer).toHaveBeenCalledWith({
      requestId: "group-1",
      actorUserId: "admin-old",
      targetUserId: "admin-new",
    });
  });

  it("lanza error al pedir transferencia en estado prohibido (Cerrada)", async () => {
    const { CerradaState } = await import("../../src/domain/states/CerradaState.js");
    const mockClosedGroup = new StudyGroup(
      "group-closed",
      "Closed Group",
      5,
      3,
      new CerradaState(),
      { emit: async () => {}, subscribe: () => {}, unsubscribe: () => {} },
    );

    mockStudyGroupRepository.loadStudyGroup.mockResolvedValue(mockClosedGroup);

    await expect(
      useCase.execute({
        requestId: "group-closed",
        actorUserId: "admin-old",
        targetUserId: "admin-new",
      }),
    ).rejects.toThrowError(InvalidStateTransitionError);

    expect(mockRepository.requestTransfer).not.toHaveBeenCalled();
    expect(mockSubject.emit).not.toHaveBeenCalled();
  });

  it("no persiste ni emite si la validación de estado falla", async () => {
    const { TransferenciaPendienteState } = await import("../../src/domain/states/TransferenciaPendienteState.js");
    const baseState = new AbiertaState();
    const pendingState = new TransferenciaPendienteState(baseState);
    const mockPendingGroup = new StudyGroup(
      "group-pending",
      "Pending Transfer Group",
      5,
      3,
      pendingState,
      { emit: async () => {}, subscribe: () => {}, unsubscribe: () => {} },
    );

    mockStudyGroupRepository.loadStudyGroup.mockResolvedValue(mockPendingGroup);

    await expect(
      useCase.execute({
        requestId: "group-pending",
        actorUserId: "admin-old",
        targetUserId: "admin-new",
      }),
    ).rejects.toThrowError(InvalidStateTransitionError);

    expect(mockRepository.requestTransfer).not.toHaveBeenCalled();
  });

  it("retorna el objeto AdminTransfer persistido", async () => {
    const mockTransfer: AdminTransfer = {
      id: "transfer-uuid",
      requestId: "group-1",
      fromUserId: "admin-old",
      toUserId: "admin-new",
      status: "pendiente",
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };

    mockRepository.requestTransfer.mockResolvedValue(mockTransfer);

    const result = await useCase.execute({
      requestId: "group-1",
      actorUserId: "admin-old",
      targetUserId: "admin-new",
    });

    expect(result).toEqual(mockTransfer);
  });
});

describe("AcceptAdminTransfer (Integration)", () => {
  let mockRepository: jest.Mocked<IAdminTransferRepository>;
  let mockStudyGroupRepository: jest.Mocked<IStudyGroupRepository>;
  let mockSubject: jest.Mocked<ISubject>;
  let useCase: AcceptAdminTransfer;

  beforeEach(() => {
    mockRepository = {
      getById: jest.fn(),
      requestTransfer: jest.fn(),
      acceptTransfer: jest.fn(),
      leaveAdminRole: jest.fn(),
    };

    const mockStudyGroup = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      3,
      new AbiertaState(),
      { emit: async () => {}, subscribe: () => {}, unsubscribe: () => {} },
    );

    mockStudyGroupRepository = {
      loadStudyGroup: jest.fn().mockResolvedValue(mockStudyGroup),
    };

    mockSubject = {
      emit: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };

    useCase = new AcceptAdminTransfer(
      mockRepository,
      mockStudyGroupRepository,
      mockSubject as any,
    );
  });

  it("emite el evento correcto tras aceptación exitosa", async () => {
    const mockTransfer: AdminTransfer = {
      id: "transfer-1",
      requestId: "group-1",
      fromUserId: "admin-old",
      toUserId: "admin-new",
      status: "pendiente",
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };

    mockRepository.getById.mockResolvedValue(mockTransfer);

    const { TransferenciaPendienteState } = await import("../../src/domain/states/TransferenciaPendienteState.js");
    const baseState = new AbiertaState();
    const pendingState = new TransferenciaPendienteState(baseState);
    const mockPendingGroup = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      3,
      pendingState,
      mockSubject as any,
    );

    mockStudyGroupRepository.loadStudyGroup.mockResolvedValue(mockPendingGroup);

    await useCase.execute({
      transferId: "transfer-1",
      actorUserId: "admin-new",
    });

    expect(mockSubject.emit).toHaveBeenCalledTimes(1);
    expect(mockSubject.emit).toHaveBeenCalledWith(
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

    expect(mockRepository.acceptTransfer).toHaveBeenCalledTimes(1);
    expect(mockRepository.acceptTransfer).toHaveBeenCalledWith({
      transferId: "transfer-1",
      actorUserId: "admin-new",
    });
  });

  it("lanza NotFoundError si la transferencia no existe", async () => {
    mockRepository.getById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        transferId: "nonexistent",
        actorUserId: "admin-new",
      }),
    ).rejects.toThrowError(NotFoundError);

    expect(mockRepository.acceptTransfer).not.toHaveBeenCalled();
    expect(mockSubject.emit).not.toHaveBeenCalled();
  });

  it("lanza error al aceptar en estado prohibido (no hay transferencia pendiente)", async () => {
    const mockTransfer: AdminTransfer = {
      id: "transfer-1",
      requestId: "group-1",
      fromUserId: "admin-old",
      toUserId: "admin-new",
      status: "pendiente",
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };

    mockRepository.getById.mockResolvedValue(mockTransfer);

    // El grupo está en estado Abierta (sin transferencia pendiente)
    const mockAbiertaGroup = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      3,
      new AbiertaState(),
      { emit: async () => {}, subscribe: () => {}, unsubscribe: () => {} },
    );

    mockStudyGroupRepository.loadStudyGroup.mockResolvedValue(mockAbiertaGroup);

    await expect(
      useCase.execute({
        transferId: "transfer-1",
        actorUserId: "admin-new",
      }),
    ).rejects.toThrowError(InvalidStateTransitionError);

    expect(mockRepository.acceptTransfer).not.toHaveBeenCalled();
  });

  it("no persiste si la emisión del evento falla", async () => {
    const mockTransfer: AdminTransfer = {
      id: "transfer-1",
      requestId: "group-1",
      fromUserId: "admin-old",
      toUserId: "admin-new",
      status: "pendiente",
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };

    mockRepository.getById.mockResolvedValue(mockTransfer);

    const { TransferenciaPendienteState } = await import("../../src/domain/states/TransferenciaPendienteState.js");
    const baseState = new AbiertaState();
    const pendingState = new TransferenciaPendienteState(baseState);

    // Mock el subject para que lance un error
    const failingSubject: ISubject = {
      emit: jest.fn().mockRejectedValue(new Error("Event emission failed")),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };

    const mockPendingGroup = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      3,
      pendingState,
      failingSubject,
    );

    mockStudyGroupRepository.loadStudyGroup.mockResolvedValue(mockPendingGroup);

    await expect(
      useCase.execute({
        transferId: "transfer-1",
        actorUserId: "admin-new",
      }),
    ).rejects.toThrowError("Event emission failed");

    expect(mockRepository.acceptTransfer).not.toHaveBeenCalled();
  });
});
