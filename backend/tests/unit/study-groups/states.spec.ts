import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { AbiertaState } from "../../../services/study-groups/src/domain/states/AbiertaState.js";
import { LlenaState } from "../../../services/study-groups/src/domain/states/LlenaState.js";
import { CerradaState } from "../../../services/study-groups/src/domain/states/CerradaState.js";
import { ExpiradaState } from "../../../services/study-groups/src/domain/states/ExpiradaState.js";
import { TransferenciaPendienteState } from "../../../services/study-groups/src/domain/states/TransferenciaPendienteState.js";
import { StudyGroup } from "../../../services/study-groups/src/domain/states/StudyGroup.js";
import { InvalidStateTransitionError } from "../../../shared/libs/errors/InvalidStateTransitionError.js";
import type { ISubject } from "../../../services/study-groups/src/domain/events/observers/ISubject.js";

const createMockSubject = (): ISubject => ({
  subscribe: mock.fn(),
  unsubscribe: mock.fn(),
  emit: mock.fn(async () => {}),
});

describe("AbiertaState", () => {
  it("permite requestAdminTransfer y emite evento", async () => {
    const mockSubject = createMockSubject();
    const state = new AbiertaState();
    const group = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      3,
      state,
      mockSubject,
    );

    await state.requestAdminTransfer("transfer-1", "admin-old", "admin-new", "abierta");

    // Validar que el evento fue emitido
    assert.strictEqual(mockSubject.emit.mock.calls.length, 1);
    const emittedEvent = mockSubject.emit.mock.calls[0].arguments[0];
    assert.strictEqual(emittedEvent.type, "TRANSFERENCIA_ADMIN_SOLICITADA");
    assert.strictEqual(emittedEvent.groupId, "group-1");
    assert.strictEqual(emittedEvent.oldAdminId, "admin-old");
    assert.strictEqual(emittedEvent.newAdminId, "admin-new");
    assert.strictEqual(emittedEvent.currentState, "abierta");
  });

  it("rechaza acceptAdminTransfer con InvalidStateTransitionError", async () => {
    const mockSubject = createMockSubject();
    const state = new AbiertaState();
    const group = new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject);
    state.setContext(group);

    await assert.rejects(
      () => state.acceptAdminTransfer("transfer-1", "user", "admin-old", "admin-new", "abierta"),
      InvalidStateTransitionError,
    );
  });

  it("permite applyToGroup", () => {
    const mockSubject = createMockSubject();
    const state = new AbiertaState();
    const group = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      3,
      state,
      mockSubject,
    );
    state.setContext(group);

    state.applyToGroup("app-1", "user-123", "John Doe", "Hola", "admin-1");

    assert.strictEqual(mockSubject.emit.mock.calls.length, 1);
    const emittedEvent = mockSubject.emit.mock.calls[0].arguments[0];
    assert.strictEqual(emittedEvent.type, "SOLICITUD_INGRESO");
  });
});

describe("LlenaState", () => {
  it("rechaza applyToGroup con InvalidStateTransitionError", () => {
    const mockSubject = createMockSubject();
    const state = new LlenaState();
    const group = new StudyGroup("group-1", "Test Group", 5, 5, state, mockSubject);
    state.setContext(group);

    assert.throws(
      () => state.applyToGroup("app-1", "user-123", "John Doe", "Hola", "admin-1"),
      InvalidStateTransitionError,
    );
  });

  it("rechaza reviewApplication(approved) con InvalidStateTransitionError", () => {
    const mockSubject = createMockSubject();
    const state = new LlenaState();
    const group = new StudyGroup("group-1", "Test Group", 5, 5, state, mockSubject);
    state.setContext(group);

    assert.throws(
      () => state.reviewApplication("app-1", "approved", "admin-1", "user-123"),
      InvalidStateTransitionError,
    );
  });

  it("permite requestAdminTransfer y emite evento", async () => {
    const mockSubject = createMockSubject();
    const state = new LlenaState();
    const group = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      5,
      state,
      mockSubject,
    );
    state.setContext(group);

    await state.requestAdminTransfer("transfer-1", "admin-old", "admin-new", "llena");

    assert.strictEqual(mockSubject.emit.mock.calls.length, 1);
    const emittedEvent = mockSubject.emit.mock.calls[0].arguments[0];
    assert.strictEqual(emittedEvent.type, "TRANSFERENCIA_ADMIN_SOLICITADA");
    assert.strictEqual(emittedEvent.currentState, "llena");
  });
});

describe("CerradaState", () => {
  it("rechaza cualquier acción de transferencia", async () => {
    const mockSubject = createMockSubject();
    const state = new CerradaState();
    const group = new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject);
    state.setContext(group);

    await assert.rejects(
      () => state.requestAdminTransfer("transfer-1", "admin-old", "admin-new", "cerrada"),
      { name: "DomainError" },
    );
  });

  it("rechaza applyToGroup", () => {
    const mockSubject = createMockSubject();
    const state = new CerradaState();
    const group = new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject);
    state.setContext(group);

    assert.throws(
      () => state.applyToGroup("app-1", "user-123", "John Doe", "Hola", "admin-1"),
      InvalidStateTransitionError,
    );
  });

  it("rechaza reviewApplication", () => {
    const mockSubject = createMockSubject();
    const state = new CerradaState();
    const group = new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject);
    state.setContext(group);

    assert.throws(
      () => state.reviewApplication("app-1", "approved", "admin-1", "user-123"),
      InvalidStateTransitionError,
    );
  });
});

describe("ExpiradaState", () => {
  it("rechaza cualquier acción de transferencia", async () => {
    const mockSubject = createMockSubject();
    const state = new ExpiradaState();
    const group = new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject);
    state.setContext(group);

    await assert.rejects(
      () => state.requestAdminTransfer("transfer-1", "admin-old", "admin-new", "expirada"),
      { name: "DomainError" },
    );
  });

  it("rechaza applyToGroup", () => {
    const mockSubject = createMockSubject();
    const state = new ExpiradaState();
    const group = new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject);
    state.setContext(group);

    assert.throws(
      () => state.applyToGroup("app-1", "user-123", "John Doe", "Hola", "admin-1"),
      InvalidStateTransitionError,
    );
  });

  it("rechaza reviewApplication", () => {
    const mockSubject = createMockSubject();
    const state = new ExpiradaState();
    const group = new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject);
    state.setContext(group);

    assert.throws(
      () => state.reviewApplication("app-1", "approved", "admin-1", "user-123"),
      InvalidStateTransitionError,
    );
  });
});

describe("TransferenciaPendienteState", () => {
  it("rechaza requestAdminTransfer con InvalidStateTransitionError", () => {
    const mockSubject = createMockSubject();
    const baseState = new AbiertaState();
    const state = new TransferenciaPendienteState(baseState);
    const group = new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject);
    state.setContext(group);

    assert.throws(
      () => state.requestAdminTransfer("transfer-1", "admin-old", "admin-new", "abierta"),
      InvalidStateTransitionError,
    );
  });

  it("permite acceptAdminTransfer y emite evento", async () => {
    const mockSubject = createMockSubject();
    const baseState = new AbiertaState();
    const state = new TransferenciaPendienteState(baseState);
    const group = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      3,
      state,
      mockSubject,
    );
    state.setContext(group);

    await state.acceptAdminTransfer(
      "transfer-1",
      "user-accept",
      "admin-old",
      "admin-new",
      "abierta",
    );

    assert.strictEqual(mockSubject.emit.mock.calls.length, 1);
    const emittedEvent = mockSubject.emit.mock.calls[0].arguments[0];
    assert.strictEqual(emittedEvent.type, "TRANSFERENCIA_ADMIN_ACEPTADA");
    assert.strictEqual(emittedEvent.groupId, "group-1");
    assert.strictEqual(emittedEvent.oldAdminId, "admin-old");
    assert.strictEqual(emittedEvent.newAdminId, "admin-new");
    assert.strictEqual(emittedEvent.newState, "abierta");
    assert.strictEqual(emittedEvent.acceptedBy, "user-accept");
  });

  it("rechaza leaveAdminRole", () => {
    const mockSubject = createMockSubject();
    const baseState = new AbiertaState();
    const state = new TransferenciaPendienteState(baseState);
    const group = new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject);
    state.setContext(group);

    assert.throws(
      () => state.leaveAdminRole("admin-1"),
      InvalidStateTransitionError,
    );
  });
});
