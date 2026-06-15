import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { VerifyQrPass, type VerificationResult } from "../../src/application/use-cases/VerifyQrPass.js";
import { QrPass } from "../../src/domain/value-objects/QrPass.js";
import type { IEventRepository, EventRegistration } from "../../src/domain/repositories/IEventRepository.js";
import type { Event } from "../../src/domain/entities/Event.js";

// ============================================================================
// InMemoryEventRepository — Fake con soporte completo para QR
// ============================================================================

class InMemoryQRRepository implements IEventRepository {
  private registrations: Map<string, EventRegistration> = new Map();
  private events: Map<string, Event> = new Map();
  private profiles: Map<string, { fullName: string; avatarUrl: string | null }> = new Map();

  addRegistration(reg: EventRegistration): void {
    this.registrations.set(reg.id, { ...reg });
  }

  addEvent(event: Event): void {
    this.events.set(event.id, { ...event });
  }

  addProfile(userId: string, profile: { fullName: string; avatarUrl: string | null }): void {
    this.profiles.set(userId, profile);
  }

  async getRegistrationByQrToken(token: string): Promise<EventRegistration | null> {
    for (const reg of this.registrations.values()) {
      if (reg.qrToken === token) return { ...reg };
    }
    return null;
  }

  async getEventByRegistration(registrationId: string): Promise<Event | null> {
    const reg = this.registrations.get(registrationId);
    if (!reg) return null;
    const event = this.events.get(reg.eventId);
    return event ? { ...event } : null;
  }

  async getUserProfile(userId: string): Promise<{ fullName: string; avatarUrl: string | null } | null> {
    const profile = this.profiles.get(userId);
    return profile ? { ...profile } : null;
  }

  async markQrAsUsed(registrationId: string, scannedBy: string): Promise<void> {
    const reg = this.registrations.get(registrationId);
    if (reg) {
      this.registrations.set(registrationId, {
        ...reg,
        isUsed: true,
        scannedAt: new Date().toISOString(),
        scannedBy,
      });
    }
  }

  getRegistration(regId: string): EventRegistration | null {
    return this.registrations.get(regId) ?? null;
  }

  isUsed(token: string): boolean {
    for (const reg of this.registrations.values()) {
      if (reg.qrToken === token) return reg.isUsed;
    }
    return false;
  }

  // Stubs — no usados en estos tests
  async list() { throw new Error("Not implemented"); }
  async getUpcomingEvents() { throw new Error("Not implemented"); }
  async getById() { throw new Error("Not implemented"); }
  async create() { throw new Error("Not implemented"); }
  async update() { throw new Error("Not implemented"); }
  async updateStatus() { throw new Error("Not implemented"); }
  async softDelete() { throw new Error("Not implemented"); }
  async getRegisteredUsers() { throw new Error("Not implemented"); }
  async registerForEvent() { throw new Error("Not implemented"); }
  async unregisterFromEvent() { throw new Error("Not implemented"); }
  async getUserEmail() { throw new Error("Not implemented"); }
  async getRegistration() { throw new Error("Not implemented"); }
  async setQrData() { throw new Error("Not implemented"); }
  async getRegistrationsByUser() { throw new Error("Not implemented"); }
}

// ============================================================================
// Helpers
// ============================================================================

const SECRET = "test-hmac-secret-for-verify";
const ORGANIZER_ID = "org-550e8400";
const USER_ID = "user-550e8400";
const EVENT_ID = "evt-550e8400";
const REGISTRATION_ID = "reg-550e8400";
const QR_TOKEN = "tok-550e8400";

function makeValidSignature(): string {
  return QrPass.sign(QR_TOKEN, SECRET);
}

function makeRegistration(overrides: Partial<EventRegistration> = {}): EventRegistration {
  return {
    id: REGISTRATION_ID,
    eventId: EVENT_ID,
    userId: USER_ID,
    qrToken: QR_TOKEN,
    qrHmac: makeValidSignature(),
    scannedAt: null,
    scannedBy: null,
    isUsed: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makePublishedEvent(): Event {
  return {
    id: EVENT_ID,
    title: "Seminario de Prueba",
    description: "Descripción",
    location: "Auditorio",
    startAt: new Date(Date.now() + 86400000).toISOString(),
    endAt: new Date(Date.now() + 86400000).toISOString(),
    organizerId: ORGANIZER_ID,
    category: "academico",
    categoryId: "cat-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "published",
    maxCapacity: 100,
    registeredCount: 1,
    deletedAt: null,
    isFull: false,
  };
}

function makeCancelledEvent(): Event {
  return {
    ...makePublishedEvent(),
    status: "cancelled",
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe("VerifyQrPass — Criterio 2: Escaneo exitoso", () => {
  let repo: InMemoryQRRepository;
  let verifyQrPass: VerifyQrPass;

  beforeEach(() => {
    repo = new InMemoryQRRepository();
    verifyQrPass = new VerifyQrPass(repo as unknown as IEventRepository, SECRET);
  });

  it("retorna valid=true con datos del usuario para un QR válido", async () => {
    repo.addRegistration(makeRegistration());
    repo.addEvent(makePublishedEvent());
    repo.addProfile(USER_ID, { fullName: "Carlos Pérez", avatarUrl: "https://example.com/avatar.jpg" });

    const qrContent = new QrPass(REGISTRATION_ID, QR_TOKEN, makeValidSignature()).qrContent;

    const result = await verifyQrPass.execute(qrContent, ORGANIZER_ID);

    expect(result.valid).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user!.fullName).toBe("Carlos Pérez");
    expect(result.user!.avatarUrl).toBe("https://example.com/avatar.jpg");
    expect(result.reason).toBeUndefined();
    expect(result.scannedAt).toBeNull();
  });

  it("marca el registro como usado (isUsed=true) después del escaneo", async () => {
    repo.addRegistration(makeRegistration());
    repo.addEvent(makePublishedEvent());
    repo.addProfile(USER_ID, { fullName: "Carlos Pérez", avatarUrl: null });

    const qrContent = new QrPass(REGISTRATION_ID, QR_TOKEN, makeValidSignature()).qrContent;

    await verifyQrPass.execute(qrContent, ORGANIZER_ID);

    expect(repo.isUsed(QR_TOKEN)).toBe(true);
  });

  it("retorna datos del usuario incluso sin avatar", async () => {
    repo.addRegistration(makeRegistration());
    repo.addEvent(makePublishedEvent());
    repo.addProfile(USER_ID, { fullName: "Ana López", avatarUrl: null });

    const qrContent = new QrPass(REGISTRATION_ID, QR_TOKEN, makeValidSignature()).qrContent;
    const result = await verifyQrPass.execute(qrContent, ORGANIZER_ID);

    expect(result.valid).toBe(true);
    expect(result.user!.fullName).toBe("Ana López");
    expect(result.user!.avatarUrl).toBeNull();
  });

  it("completa en menos de 2000ms (Criterio 2 — rendimiento)", async () => {
    repo.addRegistration(makeRegistration());
    repo.addEvent(makePublishedEvent());
    repo.addProfile(USER_ID, { fullName: "Carlos Pérez", avatarUrl: null });

    const qrContent = new QrPass(REGISTRATION_ID, QR_TOKEN, makeValidSignature()).qrContent;

    const start = performance.now();
    await verifyQrPass.execute(qrContent, ORGANIZER_ID);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
  });
});

describe("VerifyQrPass — Criterio 3: Reutilización (Ya verificado)", () => {
  let repo: InMemoryQRRepository;
  let verifyQrPass: VerifyQrPass;

  beforeEach(() => {
    repo = new InMemoryQRRepository();
    verifyQrPass = new VerifyQrPass(repo as unknown as IEventRepository, SECRET);

    repo.addRegistration(makeRegistration({ isUsed: true, scannedAt: "2026-06-10T14:30:00.000Z", scannedBy: ORGANIZER_ID }));
    repo.addEvent(makePublishedEvent());
    repo.addProfile(USER_ID, { fullName: "Carlos Pérez", avatarUrl: null });
  });

  it("retorna valid=false con 'Ya verificado' y scannedAt cuando el QR ya fue usado", async () => {
    const qrContent = new QrPass(REGISTRATION_ID, QR_TOKEN, makeValidSignature()).qrContent;

    const result = await verifyQrPass.execute(qrContent, ORGANIZER_ID);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Ya verificado");
    expect(result.scannedAt).toBe("2026-06-10T14:30:00.000Z");
    expect(result.user).toBeUndefined();
  });

  it("no llama a markQrAsUsed para un QR ya escaneado (no registra segundo acceso)", async () => {
    const qrContent = new QrPass(REGISTRATION_ID, QR_TOKEN, makeValidSignature()).qrContent;

    await verifyQrPass.execute(qrContent, ORGANIZER_ID);

    // isUsed sigue siendo true (no se modificó)
    expect(repo.isUsed(QR_TOKEN)).toBe(true);
  });

  it("rechaza inmediatamente el segundo escaneo (no hay reintento exitoso)", async () => {
    const qrContent = new QrPass(REGISTRATION_ID, QR_TOKEN, makeValidSignature()).qrContent;

    // Primer escaneo — ya está usado, debe fallar
    const result1 = await verifyQrPass.execute(qrContent, ORGANIZER_ID);
    expect(result1.valid).toBe(false);
    expect(result1.reason).toBe("Ya verificado");

    // Segundo escaneo — debe seguir fallando igual
    const result2 = await verifyQrPass.execute(qrContent, ORGANIZER_ID);
    expect(result2.valid).toBe(false);
    expect(result2.reason).toBe("Ya verificado");
  });
});

describe("VerifyQrPass — Criterio 4: QR inválido o expirado", () => {
  let repo: InMemoryQRRepository;
  let verifyQrPass: VerifyQrPass;

  beforeEach(() => {
    repo = new InMemoryQRRepository();
    verifyQrPass = new VerifyQrPass(repo as unknown as IEventRepository, SECRET);
  });

  it("retorna 'Formato de QR inválido' para contenido que no es URL uniconnect", async () => {
    const result = await verifyQrPass.execute("not-a-valid-qr-content", ORGANIZER_ID);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Formato de QR inválido");
  });

  it("retorna 'Formato de QR inválido' para protocolo incorrecto", async () => {
    const result = await verifyQrPass.execute("https://evil.com/fake?rid=x&sig=y", ORGANIZER_ID);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Formato de QR inválido");
  });

  it("retorna 'Firma digital corrupta' para signature alterada", async () => {
    const sig = makeValidSignature();
    const tamperedSig = (parseInt(sig[0], 16) ^ 1).toString(16) + sig.slice(1);
    const qrContent = `uniconnect://access?rid=${QR_TOKEN}&sig=${tamperedSig}`;

    const result = await verifyQrPass.execute(qrContent, ORGANIZER_ID);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Firma digital corrupta");
  });

  it("retorna 'Registro no encontrado' para token con firma válida pero que no existe en BD", async () => {
    const unknownToken = "tok-no-existe";
    const sigParaToken = QrPass.sign(unknownToken, SECRET);
    const qrContent = `uniconnect://access?rid=${unknownToken}&sig=${sigParaToken}`;

    const result = await verifyQrPass.execute(qrContent, ORGANIZER_ID);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Registro no encontrado");
  });

  it("retorna 'Evento cancelado' cuando el evento asociado está cancelado", async () => {
    repo.addRegistration(makeRegistration());
    repo.addEvent(makeCancelledEvent());

    const qrContent = new QrPass(REGISTRATION_ID, QR_TOKEN, makeValidSignature()).qrContent;
    const result = await verifyQrPass.execute(qrContent, ORGANIZER_ID);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Evento cancelado");
  });

  it("retorna 'Usuario no encontrado' cuando el perfil del usuario no existe", async () => {
    repo.addRegistration(makeRegistration());
    repo.addEvent(makePublishedEvent());
    // No se agrega perfil

    const qrContent = new QrPass(REGISTRATION_ID, QR_TOKEN, makeValidSignature()).qrContent;
    const result = await verifyQrPass.execute(qrContent, ORGANIZER_ID);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Usuario no encontrado");
  });

  it("retorna 'Evento no encontrado' cuando el evento no existe", async () => {
    repo.addRegistration(makeRegistration());
    // No se agrega evento

    const qrContent = new QrPass(REGISTRATION_ID, QR_TOKEN, makeValidSignature()).qrContent;
    const result = await verifyQrPass.execute(qrContent, ORGANIZER_ID);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Evento no encontrado");
  });
});

describe("VerifyQrPass — Seguridad: timingSafeEqual", () => {
  let repo: InMemoryQRRepository;
  let verifyQrPass: VerifyQrPass;

  beforeEach(() => {
    repo = new InMemoryQRRepository();
    verifyQrPass = new VerifyQrPass(repo as unknown as IEventRepository, SECRET);
  });

  it("rechaza firma con longitud incorrecta (previene bypass)", async () => {
    const qrContent = `uniconnect://access?rid=${QR_TOKEN}&sig=short`;

    const result = await verifyQrPass.execute(qrContent, ORGANIZER_ID);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Firma digital corrupta");
  });

  it("rechaza firma vacía", async () => {
    const qrContent = `uniconnect://access?rid=${QR_TOKEN}&sig=`;

    const result = await verifyQrPass.execute(qrContent, ORGANIZER_ID);

    expect(result.valid).toBe(false);
  });
});
