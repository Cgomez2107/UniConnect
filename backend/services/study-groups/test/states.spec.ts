import { describe, it, expect } from "@jest/globals";
import { AbiertaState } from "../src/domain/states/AbiertaState.js";
import { LlenaState } from "../src/domain/states/LlenaState.js";
import { CerradaState } from "../src/domain/states/CerradaState.js";
import { ExpiradaState } from "../src/domain/states/ExpiradaState.js";
import { TransferenciaPendienteState } from "../src/domain/states/TransferenciaPendienteState.js";
import { StudyGroup } from "../src/domain/states/StudyGroup.js";
import { InvalidStateTransitionError } from "../../../shared/libs/errors/InvalidStateTransitionError.js";
import type { ISubject } from "../src/domain/events/observers/ISubject.js";

const mockSubject: ISubject = {
  subscribe: () => {},
  unsubscribe: () => {},
  emit: async () => {},
};

describe("AbiertaState", () => {
  it("permite requestAdminTransfer y emite evento", async () => {
    const state = new AbiertaState();
    const events: any[] = [];
    
    const subject: ISubject = {
      subscribe: () => {},
      unsubscribe: () => {},
      emit: async (event) => {
        events.push(event);
      },
    };

    const group = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      3,
      state,
      subject,
    );

    await state.requestAdminTransfer("transfer-1", "admin-old", "admin-new", "abierta");

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("TRANSFERENCIA_ADMIN_SOLICITADA");
    expect(events[0].groupId).toBe("group-1");
    expect(events[0].oldAdminId).toBe("admin-old");
    expect(events[0].newAdminId).toBe("admin-new");
    expect(events[0].currentState).toBe("abierta");
  });

  it("rechaza acceptAdminTransfer con InvalidStateTransitionError", async () => {
    const state = new AbiertaState();
    state.setContext(
      new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject),
    );

    await expect(
      state.acceptAdminTransfer("transfer-1", "user", "admin-old", "admin-new", "abierta"),
    ).rejects.toBeInstanceOf(InvalidStateTransitionError);
  });

  it("permite applyToGroup", () => {
    const state = new AbiertaState();
    const events: any[] = [];
    
    const subject: ISubject = {
      subscribe: () => {},
      unsubscribe: () => {},
      emit: async (event) => {
        events.push(event);
      },
    };

    const group = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      3,
      state,
      subject,
    );

    state.applyToGroup("app-1", "user-123", "John Doe", "Hola", "admin-1");

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("SOLICITUD_INGRESO");
  });
});

describe("LlenaState", () => {
  it("rechaza applyToGroup con InvalidStateTransitionError", () => {
    const state = new LlenaState();
    state.setContext(
      new StudyGroup("group-1", "Test Group", 5, 5, state, mockSubject),
    );

    expect(() => {
      state.applyToGroup("app-1", "user-123", "John Doe", "Hola", "admin-1");
    }).toThrow(InvalidStateTransitionError);
  });

  it("rechaza reviewApplication(approved) con InvalidStateTransitionError", () => {
    const state = new LlenaState();
    state.setContext(
      new StudyGroup("group-1", "Test Group", 5, 5, state, mockSubject),
    );

    expect(() => {
      state.reviewApplication("app-1", "approved", "admin-1", "user-123");
    }).toThrow(InvalidStateTransitionError);
  });

  it("permite requestAdminTransfer y emite evento", async () => {
    const state = new LlenaState();
    const events: any[] = [];
    
    const subject: ISubject = {
      subscribe: () => {},
      unsubscribe: () => {},
      emit: async (event) => {
        events.push(event);
      },
    };

    const group = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      5,
      state,
      subject,
    );

    await state.requestAdminTransfer("transfer-1", "admin-old", "admin-new", "llena");

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("TRANSFERENCIA_ADMIN_SOLICITADA");
    expect(events[0].currentState).toBe("llena");
  });
});

describe("CerradaState", () => {
  it("rechaza cualquier acción de transferencia", async () => {
    const state = new CerradaState();
    state.setContext(
      new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject),
    );

    await expect(
      state.requestAdminTransfer("transfer-1", "admin-old", "admin-new", "cerrada"),
    ).rejects.toBeInstanceOf(InvalidStateTransitionError);
  });

  it("rechaza applyToGroup", () => {
    const state = new CerradaState();
    state.setContext(
      new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject),
    );

    expect(() => {
      state.applyToGroup("app-1", "user-123", "John Doe", "Hola", "admin-1");
    }).toThrow(InvalidStateTransitionError);
  });

  it("rechaza reviewApplication", () => {
    const state = new CerradaState();
    state.setContext(
      new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject),
    );

    expect(() => {
      state.reviewApplication("app-1", "approved", "admin-1", "user-123");
    }).toThrow(InvalidStateTransitionError);
  });
});

describe("ExpiradaState", () => {
  it("rechaza cualquier acción de transferencia", async () => {
    const state = new ExpiradaState();
    state.setContext(
      new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject),
    );

    await expect(
      state.requestAdminTransfer("transfer-1", "admin-old", "admin-new", "expirada"),
    ).rejects.toBeInstanceOf(InvalidStateTransitionError);
  });

  it("rechaza applyToGroup", () => {
    const state = new ExpiradaState();
    state.setContext(
      new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject),
    );

    expect(() => {
      state.applyToGroup("app-1", "user-123", "John Doe", "Hola", "admin-1");
    }).toThrow(InvalidStateTransitionError);
  });

  it("rechaza reviewApplication", () => {
    const state = new ExpiradaState();
    state.setContext(
      new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject),
    );

    expect(() => {
      state.reviewApplication("app-1", "approved", "admin-1", "user-123");
    }).toThrow(InvalidStateTransitionError);
  });
});

describe("TransferenciaPendienteState", () => {
  it("rechaza requestAdminTransfer con InvalidStateTransitionError", async () => {
    const baseState = new AbiertaState();
    const state = new TransferenciaPendienteState(baseState);
    state.setContext(
      new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject),
    );

    await expect(
      state.requestAdminTransfer("transfer-1", "admin-old", "admin-new", "abierta"),
    ).rejects.toBeInstanceOf(InvalidStateTransitionError);
  });

  it("permite acceptAdminTransfer y emite evento", async () => {
    const baseState = new AbiertaState();
    const state = new TransferenciaPendienteState(baseState);
    const events: any[] = [];
    
    const subject: ISubject = {
      subscribe: () => {},
      unsubscribe: () => {},
      emit: async (event) => {
        events.push(event);
      },
    };

    const group = new StudyGroup(
      "group-1",
      "Test Group",
      5,
      3,
      state,
      subject,
    );

    await state.acceptAdminTransfer(
      "transfer-1",
      "user-accept",
      "admin-old",
      "admin-new",
      "abierta",
    );

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("TRANSFERENCIA_ADMIN_ACEPTADA");
    expect(events[0].groupId).toBe("group-1");
    expect(events[0].oldAdminId).toBe("admin-old");
    expect(events[0].newAdminId).toBe("admin-new");
    expect(events[0].newState).toBe("abierta");
    expect(events[0].acceptedBy).toBe("user-accept");
  });

  it("rechaza leaveAdminRole", () => {
    const baseState = new AbiertaState();
    const state = new TransferenciaPendienteState(baseState);
    state.setContext(
      new StudyGroup("group-1", "Test Group", 5, 3, state, mockSubject),
    );

    expect(() => {
      state.leaveAdminRole("admin-1");
    }).toThrow(InvalidStateTransitionError);
  });
});
