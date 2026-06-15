import { describe, it, expect, vi } from "vitest";
import { GenerateQrPass } from "../../src/application/use-cases/GenerateQrPass.js";
import { QrPass } from "../../src/domain/value-objects/QrPass.js";
import type { IEventRepository, EventRegistration } from "../../src/domain/repositories/IEventRepository.js";

const SECRET = "test-hmac-secret";
const EVENT_ID = "550e8400-e29b-41d4-a716-446655440000";
const USER_ID = "550e8400-e29b-41d4-a716-446655440001";
const REGISTRATION_ID = "550e8400-e29b-41d4-a716-446655440002";
const QR_TOKEN = "550e8400-e29b-41d4-a716-446655440003";

function createMockRepo(): IEventRepository {
  const registration: EventRegistration = {
    id: REGISTRATION_ID,
    eventId: EVENT_ID,
    userId: USER_ID,
    qrToken: QR_TOKEN,
    qrHmac: null,
    scannedAt: null,
    scannedBy: null,
    isUsed: false,
    createdAt: new Date().toISOString(),
  };

  return {
    getRegistration: vi.fn().mockResolvedValue(registration),
    setQrData: vi.fn().mockResolvedValue(undefined),
    getRegistrationByQrToken: vi.fn(),
    markQrAsUsed: vi.fn(),
    getEventByRegistration: vi.fn(),
    getUserProfile: vi.fn(),
    getRegistrationsByUser: vi.fn(),
    registerForEvent: vi.fn(),
    unregisterFromEvent: vi.fn(),
    getRegisteredUsers: vi.fn(),
    getUserEmail: vi.fn(),
    list: vi.fn(),
    getUpcomingEvents: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    softDelete: vi.fn(),
  } as unknown as IEventRepository;
}

describe("GenerateQrPass", () => {
  it("genera un QrPass con firma HMAC-SHA256 válida", async () => {
    const repo = createMockRepo();
    const useCase = new GenerateQrPass(repo, SECRET);

    const result = await useCase.execute(EVENT_ID, USER_ID);

    expect(result).toBeInstanceOf(QrPass);
    expect(result.token).toBe(QR_TOKEN);
    expect(result.signature).toMatch(/^[a-f0-9]{64}$/);

    const isValid = QrPass.verify(result.token, result.signature, SECRET);
    expect(isValid).toBe(true);
  });

  it("llama a setQrData con el token y la firma correctos", async () => {
    const repo = createMockRepo();
    const useCase = new GenerateQrPass(repo, SECRET);

    await useCase.execute(EVENT_ID, USER_ID);

    expect(repo.setQrData).toHaveBeenCalledWith(
      REGISTRATION_ID,
      QR_TOKEN,
      expect.stringMatching(/^[a-f0-9]{64}$/),
    );
  });

  it("lanza error si no encuentra el registro", async () => {
    const repo = createMockRepo();
    vi.mocked(repo.getRegistration).mockResolvedValue(null);
    const useCase = new GenerateQrPass(repo, SECRET);

    await expect(useCase.execute(EVENT_ID, USER_ID)).rejects.toThrow("Registration not found");
  });

  it("usa registration.id como token si qrToken es null", async () => {
    const repo = createMockRepo();
    const regNoToken: EventRegistration = {
      id: REGISTRATION_ID,
      eventId: EVENT_ID,
      userId: USER_ID,
      qrToken: null,
      qrHmac: null,
      scannedAt: null,
      scannedBy: null,
      isUsed: false,
      createdAt: new Date().toISOString(),
    };
    vi.mocked(repo.getRegistration).mockResolvedValue(regNoToken);
    const useCase = new GenerateQrPass(repo, SECRET);

    const result = await useCase.execute(EVENT_ID, USER_ID);

    expect(result.token).toBe(REGISTRATION_ID);
    const isValid = QrPass.verify(result.token, result.signature, SECRET);
    expect(isValid).toBe(true);
  });
});
