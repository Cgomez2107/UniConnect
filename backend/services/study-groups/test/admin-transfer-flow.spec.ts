import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { GroupContext } from "../src/domain/states/GroupContext.js";
import { Active } from "../src/domain/states/Active.js";
import { PendingTransfer } from "../src/domain/states/PendingTransfer.js";
import { TransferAccepted } from "../src/domain/states/TransferAccepted.js";
import { Dissolved } from "../src/domain/states/Dissolved.js";
import { Blocked } from "../src/domain/states/Blocked.js";
import { InvalidStateTransitionError } from "../../../shared/libs/errors/InvalidStateTransitionError.js";
import type { ISubject } from "../src/domain/events/observers/ISubject.js";
import type { StudyGroupEvent } from "../src/domain/events/StudyGroupEvents.js";

function createMockSubject(): ISubject {
  return {
    subscribe: mock.fn(),
    unsubscribe: mock.fn(),
    emit: mock.fn(async () => {}),
  };
}

function lastEmitted(subject: ISubject): StudyGroupEvent {
  const calls = (subject.emit as unknown as ReturnType<typeof mock.fn>).mock.calls;
  return calls[calls.length - 1].arguments[0] as StudyGroupEvent;
}

function countEmitted(subject: ISubject): number {
  return (subject.emit as unknown as ReturnType<typeof mock.fn>).mock.calls.length;
}

// ---------------------------------------------------------------------------
// RQ-01: Active → solicitar() → PendingTransfer
// ---------------------------------------------------------------------------
describe("RQ-01 — Active.solicitar()", () => {
  it("transiciona a PendingTransfer y emite ADMIN_TRANSFER_REQUESTED con newState", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("grp-1", "Grupo Test", "admin-old", new Active(), subject);

    await group.requestAdminTransfer("admin-new");

    const event = lastEmitted(subject) as Extract<StudyGroupEvent, { type: "ADMIN_TRANSFER_REQUESTED" }>;
    assert.equal(event.type, "ADMIN_TRANSFER_REQUESTED");
    assert.equal(event.groupId, "grp-1");
    assert.equal(event.oldAdminId, "admin-old");
    assert.equal(event.newAdminId, "admin-new");
    assert.equal(event.newState, "PendienteTransferencia");
    assert.equal(event.groupName, "Grupo Test");
    assert.ok(event.transferId);

    // Verificar que el estado interno cambió a PendingTransfer
    assert.equal(group.targetUserId, "admin-new");
    assert.ok(group.transferId);

    // Desde PendingTransfer, solicitar() debe lanzar error
    await assert.rejects(
      () => group.requestAdminTransfer("otro-user"),
      InvalidStateTransitionError,
    );
  });

  it("lanza error si no se especificó targetUserId antes de solicitar", async () => {
    const subject = createMockSubject();
    const state = new Active();
    const context = { targetUserId: "" } as any;
    state.setContext(context);

    await assert.rejects(
      () => state.solicitar(),
      InvalidStateTransitionError,
    );
  });
});

// ---------------------------------------------------------------------------
// RQ-02: PendingTransfer → aceptar() → TransferAccepted
// ---------------------------------------------------------------------------
describe("RQ-02 — PendingTransfer.aceptar()", () => {
  it("transiciona a TransferAccepted y emite ADMIN_TRANSFER_ACCEPTED con newState", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("grp-1", "Grupo Test", "admin-old", new Active(), subject);

    await group.requestAdminTransfer("admin-new");
    const transferId = group.transferId;

    await group.acceptAdminTransfer(transferId);

    const event = lastEmitted(subject) as Extract<StudyGroupEvent, { type: "ADMIN_TRANSFER_ACCEPTED" }>;
    assert.equal(event.type, "ADMIN_TRANSFER_ACCEPTED");
    assert.equal(event.transferId, transferId);
    assert.equal(event.groupId, "grp-1");
    assert.equal(event.oldAdminId, "admin-old");
    assert.equal(event.newAdminId, "admin-new");
    assert.equal(event.newState, "TransferenciaAceptada");
    assert.equal(event.acceptedBy, "admin-new");

    // adminId aún no ha cambiado (se cambia en transferir())
    assert.equal(group.adminId, "admin-old");
    // targetUserId se conserva para que TransferAccepted pueda usarlo
    assert.equal(group.targetUserId, "admin-new");
  });
});

// ---------------------------------------------------------------------------
// RQ-03: TransferAccepted → transferir() → Active
// ---------------------------------------------------------------------------
describe("RQ-03 — TransferAccepted.transferir()", () => {
  it("transiciona a Active, actualiza adminId y emite ADMIN_TRANSFER_COMPLETED con newState", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("grp-1", "Grupo Test", "admin-old", new Active(), subject);

    await group.requestAdminTransfer("admin-new");
    await group.acceptAdminTransfer(group.transferId);
    await group.transferAdmin();

    const event = lastEmitted(subject) as Extract<StudyGroupEvent, { type: "ADMIN_TRANSFER_COMPLETED" }>;
    assert.equal(event.type, "ADMIN_TRANSFER_COMPLETED");
    assert.equal(event.groupId, "grp-1");
    assert.equal(event.oldAdminId, "admin-old"); // adminId previo a la transferencia
    assert.equal(event.newAdminId, "admin-new");
    assert.equal(event.newState, "Activo");

    // adminId debe haberse actualizado
    assert.equal(group.adminId, "admin-new");

    // Ahora en Active — solicitar() funciona de nuevo
    await group.requestAdminTransfer("otro-admin");
    assert.equal(group.targetUserId, "otro-admin");
  });

  it("lanza error si se llama transferir() desde Active", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("grp-1", "Grupo Test", "admin-old", new Active(), subject);

    await assert.rejects(
      () => group.transferAdmin(),
      InvalidStateTransitionError,
    );
  });
});

// ---------------------------------------------------------------------------
// RQ-04: PendingTransfer → rechazar() → Active
// ---------------------------------------------------------------------------
describe("RQ-04 — PendingTransfer.rechazar()", () => {
  it("transiciona de vuelta a Active y emite ADMIN_TRANSFER_REJECTED con newState", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("grp-1", "Grupo Test", "admin-old", new Active(), subject);

    await group.requestAdminTransfer("admin-new");
    const transferId = group.transferId;

    await group.rejectAdminTransfer();

    const event = lastEmitted(subject) as Extract<StudyGroupEvent, { type: "ADMIN_TRANSFER_REJECTED" }>;
    assert.equal(event.type, "ADMIN_TRANSFER_REJECTED");
    assert.equal(event.transferId, transferId);
    assert.equal(event.groupId, "grp-1");
    assert.equal(event.oldAdminId, "admin-old");
    assert.equal(event.newAdminId, "admin-new");
    assert.equal(event.newState, "Activo");

    // adminId no cambió
    assert.equal(group.adminId, "admin-old");

    // Ahora en Active — solicitar() funciona de nuevo
    await group.requestAdminTransfer("otro-admin");
    assert.equal(group.targetUserId, "otro-admin");
  });
});

// ---------------------------------------------------------------------------
// RQ-05: Operaciones inválidas desde cada estado
// ---------------------------------------------------------------------------
describe("RQ-05 — Operaciones inválidas", () => {
  it("desde PendingTransfer no se puede solicitar ni transferir", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("grp-1", "G", "admin-old", new Active(), subject);
    await group.requestAdminTransfer("admin-new");

    await assert.rejects(() => group.requestAdminTransfer("x"), InvalidStateTransitionError);
    await assert.rejects(() => group.transferAdmin(), InvalidStateTransitionError);
  });

  it("desde TransferAccepted no se puede solicitar ni aceptar", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("grp-1", "G", "admin-old", new Active(), subject);
    await group.requestAdminTransfer("admin-new");
    await group.acceptAdminTransfer(group.transferId);

    await assert.rejects(() => group.requestAdminTransfer("x"), InvalidStateTransitionError);
    await assert.rejects(() => group.acceptAdminTransfer("x"), InvalidStateTransitionError);
  });

  it("desde TransferAccepted, rechazar() funciona (delega a padre)", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("grp-1", "G", "admin-old", new Active(), subject);
    await group.requestAdminTransfer("admin-new");
    await group.acceptAdminTransfer(group.transferId);

    await group.rejectAdminTransfer();

    const event = lastEmitted(subject) as StudyGroupEvent;
    assert.equal(event.type, "ADMIN_TRANSFER_REJECTED");

    // De vuelta en Active
    assert.equal(group.adminId, "admin-old");
    await group.requestAdminTransfer("otro");
    assert.equal(group.targetUserId, "otro");
  });
});

// ---------------------------------------------------------------------------
// RQ-06: Dissolved y Blocked lanzan error en las 4 operaciones
// ---------------------------------------------------------------------------
describe("RQ-06 — Dissolved y Blocked rechazan todas las operaciones", () => {
  function testAllRejected(stateName: string, initialState: InstanceType<typeof Active | typeof Dissolved | typeof Blocked>) {
    describe(stateName, () => {
      it("solicitar() lanza InvalidStateTransitionError", async () => {
        const subject = createMockSubject();
        const group = new GroupContext("grp-1", "G", "admin-old", initialState, subject);
        group.targetUserId = "x";

        await assert.rejects(() => group.requestAdminTransfer("x"), InvalidStateTransitionError);
      });

      it("aceptar() lanza InvalidStateTransitionError", async () => {
        const subject = createMockSubject();
        const group = new GroupContext("grp-1", "G", "admin-old", initialState, subject);
        group.transferId = "x";

        await assert.rejects(() => group.acceptAdminTransfer("x"), InvalidStateTransitionError);
      });

      it("rechazar() lanza InvalidStateTransitionError", async () => {
        const subject = createMockSubject();
        const group = new GroupContext("grp-1", "G", "admin-old", initialState, subject);

        await assert.rejects(() => group.rejectAdminTransfer(), InvalidStateTransitionError);
      });

      it("transferir() lanza InvalidStateTransitionError", async () => {
        const subject = createMockSubject();
        const group = new GroupContext("grp-1", "G", "admin-old", initialState, subject);

        await assert.rejects(() => group.transferAdmin(), InvalidStateTransitionError);
      });
    });
  }

  testAllRejected("Dissolved", new Dissolved());
  testAllRejected("Blocked", new Blocked());
});

// ---------------------------------------------------------------------------
// RQ-07: Flujo completo end-to-end con verificación de eventos y adminId
// ---------------------------------------------------------------------------
describe("RQ-07 — Flujo completo end-to-end", () => {
  it("Active → solicitar → aceptar → transferir con eventos correctos y adminId actualizado", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("grp-1", "Grupo Test", "admin-old", new Active(), subject);

    assert.equal(group.adminId, "admin-old");

    // Paso 1: solicitar
    await group.requestAdminTransfer("admin-new");
    assert.equal(countEmitted(subject), 1);
    {
      const e = lastEmitted(subject) as Extract<StudyGroupEvent, { type: "ADMIN_TRANSFER_REQUESTED" }>;
      assert.equal(e.type, "ADMIN_TRANSFER_REQUESTED");
      assert.equal(e.newState, "PendienteTransferencia");
      assert.equal(e.oldAdminId, "admin-old");
      assert.equal(e.newAdminId, "admin-new");
    }

    const transferId = group.transferId;
    assert.ok(transferId);

    // Paso 2: aceptar
    await group.acceptAdminTransfer(transferId);
    assert.equal(countEmitted(subject), 2);
    {
      const e = lastEmitted(subject) as Extract<StudyGroupEvent, { type: "ADMIN_TRANSFER_ACCEPTED" }>;
      assert.equal(e.type, "ADMIN_TRANSFER_ACCEPTED");
      assert.equal(e.newState, "TransferenciaAceptada");
      assert.equal(e.acceptedBy, "admin-new");
    }

    // adminId aún no ha cambiado
    assert.equal(group.adminId, "admin-old");

    // Paso 3: transferir
    await group.transferAdmin();
    assert.equal(countEmitted(subject), 3);
    {
      const e = lastEmitted(subject) as Extract<StudyGroupEvent, { type: "ADMIN_TRANSFER_COMPLETED" }>;
      assert.equal(e.type, "ADMIN_TRANSFER_COMPLETED");
      assert.equal(e.newState, "Activo");
    }

    // adminId actualizado
    assert.equal(group.adminId, "admin-new");

    // El grupo está de vuelta en Active — se puede solicitar otra transferencia
    await group.requestAdminTransfer("admin-old");
    assert.equal(countEmitted(subject), 4);
    {
      const e = lastEmitted(subject) as Extract<StudyGroupEvent, { type: "ADMIN_TRANSFER_REQUESTED" }>;
      assert.equal(e.type, "ADMIN_TRANSFER_REQUESTED");
      assert.equal(e.oldAdminId, "admin-new");
      assert.equal(e.newAdminId, "admin-old");
    }
  });

  it("evento TRANSFERIDA tiene oldAdminId correcto (previo a la transferencia)", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("grp-1", "G", "admin-old", new Active(), subject);

    await group.requestAdminTransfer("admin-new");
    await group.acceptAdminTransfer(group.transferId);
    await group.transferAdmin();

    const event = lastEmitted(subject) as Extract<StudyGroupEvent, { type: "ADMIN_TRANSFER_COMPLETED" }>;
    assert.equal(event.oldAdminId, "admin-old");
    assert.equal(event.newAdminId, "admin-new");
    assert.equal(group.adminId, "admin-new");
  });
});

// ---------------------------------------------------------------------------
// Verify newState values match domain states
// ---------------------------------------------------------------------------
describe("newState — verifica valores en todos los eventos de transferencia", () => {
  it("SOLICITADA tiene newState PendienteTransferencia", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("grp-1", "G", "admin-old", new Active(), subject);
    await group.requestAdminTransfer("admin-new");

    const e = lastEmitted(subject) as Extract<StudyGroupEvent, { type: "ADMIN_TRANSFER_REQUESTED" }>;
    assert.equal(e.newState, "PendienteTransferencia");
  });

  it("ACEPTADA tiene newState TransferenciaAceptada", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("grp-1", "G", "admin-old", new Active(), subject);
    await group.requestAdminTransfer("admin-new");
    await group.acceptAdminTransfer(group.transferId);

    const e = lastEmitted(subject) as Extract<StudyGroupEvent, { type: "ADMIN_TRANSFER_ACCEPTED" }>;
    assert.equal(e.newState, "TransferenciaAceptada");
  });

  it("RECHAZADA tiene newState Activo", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("grp-1", "G", "admin-old", new Active(), subject);
    await group.requestAdminTransfer("admin-new");
    await group.rejectAdminTransfer();

    const e = lastEmitted(subject) as Extract<StudyGroupEvent, { type: "ADMIN_TRANSFER_REJECTED" }>;
    assert.equal(e.newState, "Activo");
  });

  it("TRANSFERIDA tiene newState Activo", async () => {
    const subject = createMockSubject();
    const group = new GroupContext("grp-1", "G", "admin-old", new Active(), subject);
    await group.requestAdminTransfer("admin-new");
    await group.acceptAdminTransfer(group.transferId);
    await group.transferAdmin();

    const e = lastEmitted(subject) as Extract<StudyGroupEvent, { type: "ADMIN_TRANSFER_COMPLETED" }>;
    assert.equal(e.newState, "Activo");
  });
});
