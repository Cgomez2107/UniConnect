import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { LongitudHandler } from "../LongitudHandler.js";
import { PalabrasProhibidasHandler } from "../PalabrasProhibidasHandler.js";
import { SpamHandler, type IModerationRepository } from "../SpamHandler.js";
import { EnlacesExternosHandler } from "../EnlacesExternosHandler.js";
import { ValidatorFactory } from "../ValidatorFactory.js";
import { MessageValidator } from "../MessageValidator.js";

// ============================================================================
// US-MO01 — Criterio 2: LongitudHandler (MO_001)
// ============================================================================
describe("US-MO01 Criterio 2 — LongitudHandler", () => {
  it("aprueba mensaje dentro del límite de 1000 caracteres", async () => {
    const handler = new LongitudHandler(1000);
    const result = await handler.manejar("a".repeat(500));
    assert.equal(result.valido, true);
  });

  it("rechaza mensaje que excede 1000 caracteres con MO_001", async () => {
    const handler = new LongitudHandler(1000);
    const result = await handler.manejar("a".repeat(1001));
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MO_001");
    assert.equal(result.mensajeError, "Mensaje demasiado largo");
  });

  it("aprueba mensaje exactamente de 1000 caracteres (boundary)", async () => {
    const handler = new LongitudHandler(1000);
    const result = await handler.manejar("a".repeat(1000));
    assert.equal(result.valido, true);
  });

  it("rechaza mensaje vacío sin mediaUrl con SizeError", async () => {
    const handler = new LongitudHandler(1000);
    const result = await handler.manejar("");
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "SizeError");
    assert.ok(result.mensajeError!.includes("texto o una imagen"));
  });

  it("aprueba mensaje vacío con mediaUrl", async () => {
    const handler = new LongitudHandler(1000);
    const result = await handler.manejar("", { mediaUrl: "http://img.com/photo.jpg" });
    assert.equal(result.valido, true);
  });

  it("usa 1000 como maxLength por defecto", async () => {
    const handler = new LongitudHandler();
    const ok = await handler.manejar("a".repeat(1000));
    const fail = await handler.manejar("a".repeat(1001));
    assert.equal(ok.valido, true);
    assert.equal(fail.valido, false);
    assert.equal(fail.codigoError, "MO_001");
  });
});

// ============================================================================
// US-MO01 — Criterio 3: PalabrasProhibidasHandler (MO_002)
// ============================================================================
describe("US-MO01 Criterio 3 — PalabrasProhibidasHandler", () => {
  const forbidden = ["spam", "violencia", "odio", "racismo", "discriminación", "pornografía"];

  it("aprueba mensaje sin palabras prohibidas", async () => {
    const handler = new PalabrasProhibidasHandler(forbidden);
    const result = await handler.manejar("Hola, ¿cómo están?");
    assert.equal(result.valido, true);
  });

  it("rechaza mensaje con 'spam' con MO_002 y mensaje genérico", async () => {
    const handler = new PalabrasProhibidasHandler(forbidden);
    const result = await handler.manejar("Este mensaje contiene spam");
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MO_002");
    assert.equal(result.mensajeError, "Mensaje rechazado por contener palabras no permitidas.");
  });

  it("rechaza mensaje con 'VIOLENCIA' en mayúsculas (case-insensitive)", async () => {
    const handler = new PalabrasProhibidasHandler(forbidden);
    const result = await handler.manejar("Esto es VIOLENCIA");
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MO_002");
  });

  it("rechaza mensaje con 'discriminación' con tilde", async () => {
    const handler = new PalabrasProhibidasHandler(forbidden);
    const result = await handler.manejar("No a la discriminación");
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MO_002");
  });

  it("el mensaje de error NO revela la palabra específica detectada", async () => {
    const handler = new PalabrasProhibidasHandler(forbidden);
    const result = await handler.manejar("odio");
    assert.equal(result.valido, false);
    assert.equal(result.mensajeError, "Mensaje rechazado por contener palabras no permitidas.");
    assert.ok(!result.mensajeError!.includes("odio"));
  });

  it("aprueba palabras no listadas", async () => {
    const handler = new PalabrasProhibidasHandler(forbidden);
    const result = await handler.manejar("Palabra inocente");
    assert.equal(result.valido, true);
  });

  it("aprueba contenido vacío", async () => {
    const handler = new PalabrasProhibidasHandler(forbidden);
    const result = await handler.manejar("");
    assert.equal(result.valido, true);
  });
});

// ============================================================================
// US-MO01 — Criterio 4: SpamHandler (MO_003)
// ============================================================================
describe("US-MO01 Criterio 4 — SpamHandler", () => {
  function createMockRepo(): IModerationRepository {
    return {
      isUserBlocked: mock.fn(() => Promise.resolve(false)),
      blockUser: mock.fn(() => Promise.resolve()),
      recordMessageTimestamp: mock.fn(() => Promise.resolve(0)),
      getUserBlockExpiration: mock.fn(() => Promise.resolve(null)),
    };
  }

  it("aprueba mensaje si usuario envía menos de 6 mensajes en 30s", async () => {
    const repo = createMockRepo();
    (repo.recordMessageTimestamp as any).mock.mockImplementation(() => Promise.resolve(3));
    const handler = new SpamHandler(repo);
    const result = await handler.manejar("Hola", { senderId: "user-1" });
    assert.equal(result.valido, true);
  });

  it("rechaza con MO_003 y bloquea al usuario cuando excede 5 mensajes en 30s", async () => {
    const repo = createMockRepo();
    (repo.recordMessageTimestamp as any).mock.mockImplementation(() => Promise.resolve(6));
    const handler = new SpamHandler(repo);
    const result = await handler.manejar("Mensaje spameador", { senderId: "user-2" });

    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MO_003");
    assert.ok(result.mensajeError!.includes("Spam detectado"));
    assert.ok(result.mensajeError!.includes("5 minutos"));

    assert.equal((repo.blockUser as any).mock.callCount(), 1);
    const blockCall = (repo.blockUser as any).mock.calls[0];
    assert.equal(blockCall.arguments[0], "user-2");
    assert.equal(blockCall.arguments[1], 5);
    assert.ok(blockCall.arguments[2].includes("Spam detectado"));
  });

  it("rechaza con MO_003 si el usuario ya está bloqueado (vía isUserBlocked)", async () => {
    const repo: IModerationRepository = {
      isUserBlocked: mock.fn(() => Promise.resolve(true)),
      blockUser: mock.fn(() => Promise.resolve()),
      recordMessageTimestamp: mock.fn(() => Promise.resolve(0)),
    };
    const handler = new SpamHandler(repo);
    const result = await handler.manejar("Otro mensaje", { senderId: "user-3" });

    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MO_003");
    assert.ok(result.mensajeError!.includes("bloqueado temporalmente"));
    assert.equal((repo.blockUser as any).mock.callCount(), 0);
  });

  it("rechaza con MO_003 si el usuario ya está bloqueado (vía getUserBlockExpiration)", async () => {
    const repo: IModerationRepository = {
      isUserBlocked: mock.fn(() => Promise.resolve(false)),
      blockUser: mock.fn(() => Promise.resolve()),
      recordMessageTimestamp: mock.fn(() => Promise.resolve(0)),
      getUserBlockExpiration: mock.fn(() => Promise.resolve(new Date(Date.now() + 120000))),
    };
    const handler = new SpamHandler(repo);
    const result = await handler.manejar("Otro mensaje", { senderId: "user-3" });

    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MO_003");
    assert.ok(result.mensajeError!.includes("bloqueado temporalmente"));
    assert.equal((repo.blockUser as any).mock.callCount(), 0);
  });

  it("no bloquea si el mensaje no tiene senderId", async () => {
    const repo = createMockRepo();
    const handler = new SpamHandler(repo);
    const result = await handler.manejar("Mensaje anónimo");
    assert.equal(result.valido, true);
    assert.equal((repo.recordMessageTimestamp as any).mock.callCount(), 0);
  });

  it("registra el bloqueo con duración de 5 minutos", async () => {
    const repo = createMockRepo();
    (repo.recordMessageTimestamp as any).mock.mockImplementation(() => Promise.resolve(6));
    const handler = new SpamHandler(repo);
    await handler.manejar("Spam", { senderId: "user-4" });

    const blockCall = (repo.blockUser as any).mock.calls[0];
    assert.equal(blockCall.arguments[1], 5);
  });

  it("usa getUserBlockExpiration si está disponible", async () => {
    const repo: IModerationRepository = {
      isUserBlocked: mock.fn(() => Promise.resolve(false)),
      blockUser: mock.fn(() => Promise.resolve()),
      recordMessageTimestamp: mock.fn(() => Promise.resolve(1)),
      getUserBlockExpiration: mock.fn(() => Promise.resolve(new Date(Date.now() + 60000))),
    };
    const handler = new SpamHandler(repo);
    const result = await handler.manejar("Mensaje normal", { senderId: "user-5" });
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MO_003");
    assert.equal((repo.getUserBlockExpiration as any).mock.callCount(), 1);
  });
});

// ============================================================================
// US-MO01 — Criterio 1: Composición de la cadena y short-circuit
// ============================================================================
describe("US-MO01 Criterio 1 — Composición de cadena (Chain of Responsibility)", () => {
  it("la cadena se compone en orden: Longitud → PalabrasProhibidas → Spam → EnlacesExternos", () => {
    const repo: IModerationRepository = {
      isUserBlocked: () => Promise.resolve(false),
      blockUser: () => Promise.resolve(),
      recordMessageTimestamp: () => Promise.resolve(0),
    };
    const chain = ValidatorFactory.createChain(1000, ["spam"], undefined, undefined, repo);

    assert.ok(chain instanceof LongitudHandler, "La cabeza debe ser LongitudHandler");
  });

  it("short-circuit: mensaje > 1000 chars falla en LongitudHandler (MO_001) y NO llega a PalabrasProhibidas", async () => {
    let forbiddenReached = false;
    const handler = new LongitudHandler(1000);
    handler.setSiguiente(
      new (class extends MessageValidator {
        protected async validar() {
          forbiddenReached = true;
          return { valido: true };
        }
      })(),
    );

    const result = await handler.manejar("a".repeat(1001));
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MO_001");
    assert.equal(forbiddenReached, false, "PalabrasProhibidas NO debe ejecutarse");
  });

  it("short-circuit: mensaje con palabra prohibida falla en PalabrasProhibidas (MO_002) y NO llega a SpamHandler", async () => {
    let spamReached = false;
    const handler = new LongitudHandler(1000);
    handler.setSiguiente(
      new PalabrasProhibidasHandler(["spam"]),
    );
    handler.setSiguiente(
      new (class extends MessageValidator {
        protected async validar() {
          spamReached = true;
          return { valido: true };
        }
      })(),
    );

    const result = await handler.manejar("mensaje con spam", { senderId: "user-1" });
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MO_002");
    assert.equal(spamReached, false, "SpamHandler NO debe ejecutarse");
  });

  it("short-circuit: spammer detectado en SpamHandler (MO_003) y NO llega a EnlacesExternos", async () => {
    const repo: IModerationRepository = {
      isUserBlocked: () => Promise.resolve(false),
      blockUser: () => Promise.resolve(),
      recordMessageTimestamp: () => Promise.resolve(6),
    };

    let enlacesReached = false;
    const handler = new LongitudHandler(1000);
    handler.setSiguiente(new PalabrasProhibidasHandler([]));
    handler.setSiguiente(new SpamHandler(repo));
    handler.setSiguiente(
      new (class extends MessageValidator {
        protected async validar() {
          enlacesReached = true;
          return { valido: true };
        }
      })(),
    );

    const result = await handler.manejar("mensaje normal", { senderId: "spammer-1" });
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MO_003");
    assert.equal(enlacesReached, false, "EnlacesExternos NO debe ejecutarse");
  });

  it("mensaje válido pasa toda la cadena completa", async () => {
    const repo: IModerationRepository = {
      isUserBlocked: () => Promise.resolve(false),
      blockUser: () => Promise.resolve(),
      recordMessageTimestamp: () => Promise.resolve(1),
    };
    const chain = ValidatorFactory.createChain(1000, ["spam"], undefined, undefined, repo);

    const result = await chain.manejar("Hola, este es un mensaje válido", { senderId: "user-ok" });
    assert.equal(result.valido, true);
  });

  it("EnlacesExternosHandler es un placeholder que siempre aprueba", async () => {
    const handler = new EnlacesExternosHandler();
    const result = await handler.manejar("cualquier contenido");
    assert.equal(result.valido, true);
  });
});

// ============================================================================
// Integración: ValidatorFactory con todos los handlers MO
// ============================================================================
describe("US-MO01 — Integración ValidatorFactory", () => {
  it("rechaza mensaje muy largo desde la fábrica", async () => {
    const repo: IModerationRepository = {
      isUserBlocked: () => Promise.resolve(false),
      blockUser: () => Promise.resolve(),
      recordMessageTimestamp: () => Promise.resolve(1),
    };
    const chain = ValidatorFactory.createChain(1000, ["spam"], undefined, undefined, repo);
    const result = await chain.manejar("a".repeat(1001));
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MO_001");
  });

  it("rechaza palabra prohibida desde la fábrica", async () => {
    const repo: IModerationRepository = {
      isUserBlocked: () => Promise.resolve(false),
      blockUser: () => Promise.resolve(),
      recordMessageTimestamp: () => Promise.resolve(1),
    };
    const chain = ValidatorFactory.createChain(1000, ["spam", "violencia"], undefined, undefined, repo);
    const result = await chain.manejar("mensaje con violencia");
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MO_002");
  });

  it("rechaza spam desde la fábrica", async () => {
    const repo: IModerationRepository = {
      isUserBlocked: () => Promise.resolve(false),
      blockUser: () => Promise.resolve(),
      recordMessageTimestamp: () => Promise.resolve(6),
    };
    const chain = ValidatorFactory.createChain(1000, ["spam"], undefined, undefined, repo);
    const result = await chain.manejar("mensaje", { senderId: "spammer" });
    assert.equal(result.valido, false);
    assert.equal(result.codigoError, "MO_003");
  });
});
