import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LongitudHandler } from "../LongitudHandler.js";
import { PalabrasProhibidasHandler } from "../PalabrasProhibidasHandler.js";
import { SpamHandler, type IModerationRepository } from "../SpamHandler.js";
import { EnlacesExternosHandler } from "../EnlacesExternosHandler.js";
import { MessageValidator } from "../MessageValidator.js";
import { ValidatorFactory, resolveForbiddenWords } from "../ValidatorFactory.js";

// ============================================================================
// US-T06 — Criterio 1: Cada handler aislado con approve y reject
// Cobertura de líneas >= 90% para el módulo de moderación
// ============================================================================

describe("US-T06 Criterio 1 — LongitudHandler (MO_001)", () => {
  it("aprueba mensaje dentro del límite de 1000 caracteres", async () => {
    const handler = new LongitudHandler(1000);
    const result = await handler.manejar("a".repeat(500));
    expect(result.valido).toBe(true);
  });

  it("rechaza mensaje que excede 1000 caracteres con código MO_001", async () => {
    const handler = new LongitudHandler(1000);
    const result = await handler.manejar("a".repeat(1001));
    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("MO_001");
    expect(result.mensajeError).toBe("Mensaje demasiado largo");
  });

  it("aprueba mensaje exactamente de 1000 caracteres (límite exacto)", async () => {
    const handler = new LongitudHandler(1000);
    const result = await handler.manejar("a".repeat(1000));
    expect(result.valido).toBe(true);
  });

  it("rechaza mensaje vacío sin mediaUrl con SizeError", async () => {
    const handler = new LongitudHandler(1000);
    const result = await handler.manejar("");
    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("SizeError");
    expect(result.mensajeError).toContain("texto o una imagen");
  });

  it("aprueba mensaje vacío con mediaUrl presente", async () => {
    const handler = new LongitudHandler(1000);
    const result = await handler.manejar("", { mediaUrl: "https://img.com/photo.jpg" });
    expect(result.valido).toBe(true);
  });

  it("usa 1000 como maxLength por defecto", async () => {
    const handler = new LongitudHandler();
    const ok = await handler.manejar("a".repeat(1000));
    const fail = await handler.manejar("a".repeat(1001));
    expect(ok.valido).toBe(true);
    expect(fail.valido).toBe(false);
    expect(fail.codigoError).toBe("MO_001");
  });

  it("maneja correctamente contenido con espacios (trim antes de validar)", async () => {
    const handler = new LongitudHandler(5);
    const result = await handler.manejar("   hola   ");
    expect(result.valido).toBe(true);
  });
});

describe("US-T06 Criterio 1 — PalabrasProhibidasHandler (MO_002)", () => {
  const testWords = ["spam", "violencia", "odio"];

  it("aprueba mensaje sin palabras prohibidas", async () => {
    const handler = new PalabrasProhibidasHandler(testWords);
    const result = await handler.manejar("Hola, ¿cómo están todos?");
    expect(result.valido).toBe(true);
  });

  it("rechaza mensaje que contiene 'spam' con código MO_002", async () => {
    const handler = new PalabrasProhibidasHandler(testWords);
    const result = await handler.manejar("Este mensaje tiene spam");
    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("MO_002");
  });

  it("rechaza mensaje con palabra en mayúsculas (case-insensitive)", async () => {
    const handler = new PalabrasProhibidasHandler(testWords);
    const result = await handler.manejar("Esto es VIOLENCIA");
    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("MO_002");
  });

  it("aprueba contenido vacío", async () => {
    const handler = new PalabrasProhibidasHandler(testWords);
    const result = await handler.manejar("");
    expect(result.valido).toBe(true);
  });

  it("no revela la palabra específica detectada en el mensaje de error", async () => {
    const handler = new PalabrasProhibidasHandler(testWords);
    const result = await handler.manejar("odio");
    expect(result.valido).toBe(false);
    expect(result.mensajeError).toBe("Mensaje rechazado por contener palabras no permitidas.");
    expect(result.mensajeError).not.toContain("odio");
  });

  it("rechaza con mensaje genérico independientemente de la palabra", async () => {
    const handler = new PalabrasProhibidasHandler(["arma", "droga"]);
    const r1 = await handler.manejar("mensaje con arma");
    const r2 = await handler.manejar("mensaje con droga");
    expect(r1.mensajeError).toBe(r2.mensajeError);
  });
});

describe("US-T06 Criterio 1 — SpamHandler (MO_003 / MO_004)", () => {
  let mockRepo: IModerationRepository;

  beforeEach(() => {
    mockRepo = {
      isUserBlocked: vi.fn(),
      blockUser: vi.fn(),
      recordMessageTimestamp: vi.fn(),
      getUserBlockExpiration: vi.fn(),
      recordBlockEvent: vi.fn(),
      countBlocksInLastHour: vi.fn(),
    };
  });

  it("aprueba mensaje cuando el usuario NO excede el límite de mensajes (count <= 5)", async () => {
    mockRepo.isUserBlocked = vi.fn().mockResolvedValue(false);
    mockRepo.getUserBlockExpiration = vi.fn().mockResolvedValue(null);
    mockRepo.recordMessageTimestamp = vi.fn().mockResolvedValue(3);
    mockRepo.countBlocksInLastHour = vi.fn().mockResolvedValue(0);

    const handler = new SpamHandler(mockRepo);
    const result = await handler.manejar("Hola", { senderId: "user-1" });

    expect(result.valido).toBe(true);
    expect(mockRepo.blockUser).not.toHaveBeenCalled();
  });

  it("rechaza con MO_003 y bloquea al usuario cuando excede 5 mensajes en 30s", async () => {
    mockRepo.isUserBlocked = vi.fn().mockResolvedValue(false);
    mockRepo.getUserBlockExpiration = vi.fn().mockResolvedValue(null);
    mockRepo.recordMessageTimestamp = vi.fn().mockResolvedValue(6);
    mockRepo.countBlocksInLastHour = vi.fn().mockResolvedValue(1);

    const handler = new SpamHandler(mockRepo);
    const result = await handler.manejar("Mensaje spameador", { senderId: "user-2" });

    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("MO_003");
    expect(result.mensajeError).toContain("Spam detectado");
    expect(result.mensajeError).toContain("5 minutos");
    expect(mockRepo.blockUser).toHaveBeenCalledWith("user-2", 5, expect.any(String));
    expect(mockRepo.recordBlockEvent).toHaveBeenCalledWith("user-2", expect.any(String));
  });

  it("rechaza con MO_003 si el usuario ya está bloqueado (vía isUserBlocked)", async () => {
    const localMock: IModerationRepository = {
      isUserBlocked: vi.fn().mockResolvedValue(true),
      blockUser: vi.fn().mockResolvedValue(undefined),
      recordMessageTimestamp: vi.fn().mockResolvedValue(0),
      countBlocksInLastHour: vi.fn().mockResolvedValue(1),
      recordBlockEvent: vi.fn().mockResolvedValue(undefined),
    };

    const handler = new SpamHandler(localMock);
    const result = await handler.manejar("Otro mensaje", { senderId: "user-3" });

    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("MO_003");
    expect(result.mensajeError).toContain("bloqueado temporalmente");
    expect(localMock.blockUser).not.toHaveBeenCalled();
  });

  it("rechaza con MO_003 si el usuario ya está bloqueado (vía getUserBlockExpiration)", async () => {
    mockRepo.isUserBlocked = vi.fn().mockResolvedValue(false);
    mockRepo.getUserBlockExpiration = vi.fn().mockResolvedValue(new Date(Date.now() + 120000));
    mockRepo.countBlocksInLastHour = vi.fn().mockResolvedValue(1);

    const handler = new SpamHandler(mockRepo);
    const result = await handler.manejar("Otro mensaje", { senderId: "user-3" });

    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("MO_003");
    expect(result.mensajeError).toContain("bloqueado temporalmente");
    expect(mockRepo.blockUser).not.toHaveBeenCalled();
  });

  it("rechaza con MO_004 si hay 3 o más bloqueos en la última hora", async () => {
    mockRepo.isUserBlocked = vi.fn().mockResolvedValue(false);
    mockRepo.getUserBlockExpiration = vi.fn().mockResolvedValue(null);
    mockRepo.recordMessageTimestamp = vi.fn().mockResolvedValue(6);
    mockRepo.countBlocksInLastHour = vi.fn().mockResolvedValue(3);

    const handler = new SpamHandler(mockRepo);
    const result = await handler.manejar("Spam", { senderId: "user-4" });

    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("MO_004");
    expect(result.mensajeError).toContain("escalado a revisión humana");
  });

  it("rechaza con MO_004 si usuario bloqueado y tiene >= 3 bloques en última hora", async () => {
    mockRepo.getUserBlockExpiration = vi.fn().mockResolvedValue(new Date(Date.now() + 60000));
    mockRepo.countBlocksInLastHour = vi.fn().mockResolvedValue(3);

    const handler = new SpamHandler(mockRepo);
    const result = await handler.manejar("Msg", { senderId: "user-5" });

    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("MO_004");
  });

  it("aprueba mensaje si no tiene senderId (sin control de spam)", async () => {
    const handler = new SpamHandler(mockRepo);
    const result = await handler.manejar("Mensaje anónimo");
    expect(result.valido).toBe(true);
    expect(mockRepo.recordMessageTimestamp).not.toHaveBeenCalled();
  });
});

describe("US-T06 Criterio 1 — EnlacesExternosHandler", () => {
  it("siempre aprueba (handler placeholder)", async () => {
    const handler = new EnlacesExternosHandler();
    const result = await handler.manejar("cualquier contenido");
    expect(result.valido).toBe(true);
  });
});

// ============================================================================
// US-T06 — Criterio 2: Cadena completa con cortocircuito
// Cuando el handler 3 rechaza, handlers 1 y 2 deben haberse invocado
// y el handler 4 NO debe haberse invocado
// ============================================================================

describe("US-T06 Criterio 2 — Cadena completa: cortocircuito en handler 3", () => {
  let mockRepo: IModerationRepository;

  beforeEach(() => {
    mockRepo = {
      isUserBlocked: vi.fn(),
      blockUser: vi.fn(),
      recordMessageTimestamp: vi.fn(),
      getUserBlockExpiration: vi.fn(),
      recordBlockEvent: vi.fn(),
      countBlocksInLastHour: vi.fn(),
    };
  });

  it("rechazo en SpamHandler (3er): LongitudHandler y PalabrasProhibidasHandler invocados, EnlacesExternos NO invocado", async () => {
    mockRepo.isUserBlocked = vi.fn().mockResolvedValue(false);
    mockRepo.getUserBlockExpiration = vi.fn().mockResolvedValue(null);
    mockRepo.recordMessageTimestamp = vi.fn().mockResolvedValue(6);
    mockRepo.countBlocksInLastHour = vi.fn().mockResolvedValue(1);

    const h1 = new LongitudHandler(1000);
    const h2 = new PalabrasProhibidasHandler(["spam"]);
    const h3 = new SpamHandler(mockRepo);
    const h4 = new EnlacesExternosHandler();

    const spy1 = vi.spyOn(h1, "manejar");
    const spy2 = vi.spyOn(h2, "manejar");
    const spy3 = vi.spyOn(h3, "manejar");
    const spy4 = vi.spyOn(h4, "manejar");

    h1.setSiguiente(h2);
    h2.setSiguiente(h3);
    h3.setSiguiente(h4);

    const result = await h1.manejar("mensaje normal", { senderId: "spammer" });

    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("MO_003");
    expect(spy1).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
    expect(spy3).toHaveBeenCalled();
    expect(spy4).not.toHaveBeenCalled();
  });

  it("mensaje válido pasa toda la cadena completa sin cortocircuito", async () => {
    mockRepo.isUserBlocked = vi.fn().mockResolvedValue(false);
    mockRepo.getUserBlockExpiration = vi.fn().mockResolvedValue(null);
    mockRepo.recordMessageTimestamp = vi.fn().mockResolvedValue(1);
    mockRepo.countBlocksInLastHour = vi.fn().mockResolvedValue(0);

    const h1 = new LongitudHandler(1000);
    const h2 = new PalabrasProhibidasHandler(["spam"]);
    const h3 = new SpamHandler(mockRepo);
    const h4 = new EnlacesExternosHandler();

    const spy1 = vi.spyOn(h1, "manejar");
    const spy2 = vi.spyOn(h2, "manejar");
    const spy3 = vi.spyOn(h3, "manejar");
    const spy4 = vi.spyOn(h4, "manejar");

    h1.setSiguiente(h2);
    h2.setSiguiente(h3);
    h3.setSiguiente(h4);

    const result = await h1.manejar("Mensaje válido y seguro", { senderId: "user-ok" });

    expect(result.valido).toBe(true);
    expect(spy1).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
    expect(spy3).toHaveBeenCalled();
    expect(spy4).toHaveBeenCalled();
  });

  it("rechazo en LongitudHandler (1er): handlers 2, 3 y 4 NO invocados", async () => {
    const h1 = new LongitudHandler(5);
    const h2 = new PalabrasProhibidasHandler(["spam"]);
    const h3 = new EnlacesExternosHandler();

    const spy1 = vi.spyOn(h1, "manejar");
    const spy2 = vi.spyOn(h2, "manejar");
    const spy3 = vi.spyOn(h3, "manejar");

    h1.setSiguiente(h2);
    h2.setSiguiente(h3);

    const result = await h1.manejar("123456", { senderId: "user" });

    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("MO_001");
    expect(spy1).toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
    expect(spy3).not.toHaveBeenCalled();
  });

  it("rechazo en PalabrasProhibidasHandler (2do): handlers 3 y 4 NO invocados", async () => {
    const h1 = new LongitudHandler(1000);
    const h2 = new PalabrasProhibidasHandler(["spam"]);
    const h3 = new EnlacesExternosHandler();

    const spy1 = vi.spyOn(h1, "manejar");
    const spy2 = vi.spyOn(h2, "manejar");
    const spy3 = vi.spyOn(h3, "manejar");

    h1.setSiguiente(h2);
    h2.setSiguiente(h3);

    const result = await h1.manejar("mensaje con spam", { senderId: "user" });

    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("MO_002");
    expect(spy1).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
    expect(spy3).not.toHaveBeenCalled();
  });
});

// ============================================================================
// US-T06 — Criterio 3: SpamHandler con 6 mensajes en 25 segundos
// El test simula 6 mensajes del mismo userId, el 6º es rechazado con MO_003
// Usa mocks del repositorio, NO toca base de datos real
// ============================================================================

describe("US-T06 Criterio 3 — SpamHandler: 6 mensajes en 25s", () => {
  it("simula 6 mensajes en 25s del mismo userId y rechaza el sexto con MO_003 usando mocks", async () => {
    let msgCount = 0;

    const mockRepo: IModerationRepository = {
      isUserBlocked: vi.fn().mockResolvedValue(false),
      blockUser: vi.fn().mockResolvedValue(undefined),
      recordMessageTimestamp: vi.fn().mockImplementation(() => {
        msgCount++;
        return Promise.resolve(msgCount);
      }),
      recordBlockEvent: vi.fn().mockResolvedValue(undefined),
      countBlocksInLastHour: vi.fn().mockResolvedValue(0),
    };

    const handler = new SpamHandler(mockRepo);
    const userId = "user-spam-test";

    for (let i = 0; i < 5; i++) {
      const result = await handler.manejar(`Mensaje ${i + 1}`, { senderId: userId });
      expect(result.valido).toBe(true);
    }

    const sixthResult = await handler.manejar("Mensaje 6", { senderId: userId });

    expect(sixthResult.valido).toBe(false);
    expect(sixthResult.codigoError).toBe("MO_003");
    expect(mockRepo.blockUser).toHaveBeenCalledWith(userId, 5, expect.any(String));
    expect(mockRepo.recordBlockEvent).toHaveBeenCalledWith(userId, expect.any(String));

    expect(mockRepo.recordMessageTimestamp).toHaveBeenCalledTimes(6);
    expect(mockRepo.blockUser).toHaveBeenCalledTimes(1);
    expect(mockRepo.isUserBlocked).toHaveBeenCalledTimes(6);
  });
});

// ============================================================================
// US-T06 — Criterio 4: PalabrasProhibidasHandler lee desde configuración
// Los tests NO tienen la lista hardcodeada, usan resolveForbiddenWords
// que lee desde process.env.FORBIDDEN_WORDS (misma fuente que producción)
// ============================================================================

describe("US-T06 Criterio 4 — PalabrasProhibidasHandler desde configuración", () => {
  const ORIGINAL_FORBIDDEN_WORDS = process.env.FORBIDDEN_WORDS;

  afterEach(() => {
    process.env.FORBIDDEN_WORDS = ORIGINAL_FORBIDDEN_WORDS;
  });

  it("usa resolveForbiddenWords() que lee la variable de entorno FORBIDDEN_WORDS", async () => {
    process.env.FORBIDDEN_WORDS = "alpha,beta,gamma";
    const words = resolveForbiddenWords();
    const handler = new PalabrasProhibidasHandler(words);

    expect((await handler.manejar("contiene alpha")).valido).toBe(false);
    expect((await handler.manejar("contiene beta")).valido).toBe(false);
    expect((await handler.manejar("contiene gamma")).valido).toBe(false);
    expect((await handler.manejar("mensaje seguro sin palabras prohibidas")).valido).toBe(true);
  });

  it("resolveForbiddenWords sin FORBIDDEN_WORDS retorna la lista por defecto", async () => {
    delete process.env.FORBIDDEN_WORDS;
    const words = resolveForbiddenWords();
    expect(words.length).toBeGreaterThan(0);
    expect(words).toContain("violencia");
    expect(words).toContain("spam");
    expect(words).toContain("odio");
  });

  it("ValidatorFactory.createChain integra resolveForbiddenWords correctamente", async () => {
    process.env.FORBIDDEN_WORDS = "custom1,custom2";
    const chain = ValidatorFactory.createChain(1000);
    const result1 = await chain.manejar("contiene custom1");
    const result2 = await chain.manejar("contiene custom2");
    const result3 = await chain.manejar("mensaje seguro");

    expect(result1.valido).toBe(false);
    expect(result1.codigoError).toBe("MO_002");
    expect(result2.valido).toBe(false);
    expect(result2.codigoError).toBe("MO_002");
    expect(result3.valido).toBe(true);
  });

  it("comportamiento con FORBIDDEN_WORDS vacío no bloquea nada", async () => {
    process.env.FORBIDDEN_WORDS = "";
    const words = resolveForbiddenWords();
    const handler = new PalabrasProhibidasHandler(words);

    const result = await handler.manejar("cualquier cosa");
    expect(result.valido).toBe(true);
  });
});

// ============================================================================
// US-T06 — Integración: ValidatorFactory con todos los handlers
// ============================================================================

describe("US-T06 — Integración ValidatorFactory con moderación completa", () => {
  it("rechaza mensaje muy largo desde la fábrica", async () => {
    const chain = ValidatorFactory.createChain(1000, ["spam"]);
    const result = await chain.manejar("a".repeat(1001));
    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("MO_001");
  });

  it("rechaza palabra prohibida desde la fábrica", async () => {
    const chain = ValidatorFactory.createChain(1000, ["spam", "violencia"]);
    const result = await chain.manejar("mensaje con violencia");
    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("MO_002");
  });

  it("rechaza spam desde la fábrica con repositorio mockeado", async () => {
    const mockRepo: IModerationRepository = {
      isUserBlocked: vi.fn().mockResolvedValue(false),
      blockUser: vi.fn().mockResolvedValue(undefined),
      recordMessageTimestamp: vi.fn().mockResolvedValue(6),
      recordBlockEvent: vi.fn().mockResolvedValue(undefined),
      countBlocksInLastHour: vi.fn().mockResolvedValue(1),
    };
    const chain = ValidatorFactory.createChain(1000, ["spam"], undefined, undefined, mockRepo);
    const result = await chain.manejar("mensaje", { senderId: "spammer" });
    expect(result.valido).toBe(false);
    expect(result.codigoError).toBe("MO_003");
  });

  it("mensaje válido pasa toda la cadena desde la fábrica", async () => {
    const mockRepo: IModerationRepository = {
      isUserBlocked: vi.fn().mockResolvedValue(false),
      blockUser: vi.fn().mockResolvedValue(undefined),
      recordMessageTimestamp: vi.fn().mockResolvedValue(1),
    };
    const chain = ValidatorFactory.createChain(1000, ["spam"], undefined, undefined, mockRepo);
    const result = await chain.manejar("Hola, mensaje válido", { senderId: "user-ok" });
    expect(result.valido).toBe(true);
  });
});
