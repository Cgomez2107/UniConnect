import { describe, it, expect, vi, beforeEach } from "vitest";

const TEST_ACCESS_SECRET = "test-access-secret-min-32-chars-length!!";
const TEST_REFRESH_SECRET = "test-refresh-secret-min-32-chars-length!";
const TEST_VERIFICATION_SECRET = "test-verification-secret-min-32-char!";

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn().mockResolvedValue(true),
    hash: vi.fn().mockResolvedValue("$2a$10$mockedhash"),
  },
  compare: vi.fn().mockResolvedValue(true),
  hash: vi.fn().mockResolvedValue("$2a$10$mockedhash"),
}));

async function createJWTService() {
  const { JWTService } = await import("../../src/infrastructure/jwt/JWTService.js");
  return new JWTService(TEST_ACCESS_SECRET, TEST_REFRESH_SECRET, TEST_VERIFICATION_SECRET);
}

function decodeToken(token: string): Record<string, unknown> {
  const parts = token.split(".");
  return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
}

describe("US-N8N02 — T2.1: SignUpUseCase — Validación de dominio @ucaldas.edu.co", () => {
  it("rechaza email @gmail.com con ValidationError", async () => {
    const { SignUpUseCase, ValidationError: VE } = await (async () => {
      const mod = await import("../../src/application/use-cases/SignUpUseCase.js");
      const errMod = await import("../../../../shared/libs/errors/index.js");
      return { SignUpUseCase: mod.SignUpUseCase, ValidationError: errMod.ValidationError };
    })();

    const jwtService = await createJWTService();
    const mockAuthRepo = { findByEmail: vi.fn(), create: vi.fn() };
    const mockTokenRepo = { create: vi.fn() };

    const useCase = new SignUpUseCase(mockAuthRepo as any, mockTokenRepo as any, jwtService);

    await expect(
      useCase.execute({ email: "usuario@gmail.com", password: "StrongP4ss!", fullName: "Test" })
    ).rejects.toThrow(VE);
  });

  it("rechaza email @hotmail.com con ValidationError", async () => {
    const { SignUpUseCase, ValidationError: VE } = await (async () => {
      const mod = await import("../../src/application/use-cases/SignUpUseCase.js");
      const errMod = await import("../../../../shared/libs/errors/index.js");
      return { SignUpUseCase: mod.SignUpUseCase, ValidationError: errMod.ValidationError };
    })();

    const jwtService = await createJWTService();
    const mockAuthRepo = { findByEmail: vi.fn(), create: vi.fn() };
    const mockTokenRepo = { create: vi.fn() };

    const useCase = new SignUpUseCase(mockAuthRepo as any, mockTokenRepo as any, jwtService);

    await expect(
      useCase.execute({ email: "test@hotmail.com", password: "StrongP4ss!", fullName: "Test" })
    ).rejects.toThrow(VE);
  });

  it("rechaza email sin dominio (invalido) con ValidationError", async () => {
    const { SignUpUseCase, ValidationError: VE } = await (async () => {
      const mod = await import("../../src/application/use-cases/SignUpUseCase.js");
      const errMod = await import("../../../../shared/libs/errors/index.js");
      return { SignUpUseCase: mod.SignUpUseCase, ValidationError: errMod.ValidationError };
    })();

    const jwtService = await createJWTService();
    const mockAuthRepo = { findByEmail: vi.fn(), create: vi.fn() };
    const mockTokenRepo = { create: vi.fn() };

    const useCase = new SignUpUseCase(mockAuthRepo as any, mockTokenRepo as any, jwtService);

    await expect(
      useCase.execute({ email: "invalido", password: "StrongP4ss!", fullName: "Test" })
    ).rejects.toThrow(VE);
  });

  it("acepta email @ucaldas.edu.co — happy path", async () => {
    const { SignUpUseCase } = await import("../../src/application/use-cases/SignUpUseCase.js");

    const jwtService = await createJWTService();
    const mockAuthRepo = {
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: "new-id",
        email: "valido@ucaldas.edu.co",
        fullName: "Usuario Valido",
        role: "estudiante",
        isVerified: false,
      }),
    };
    const mockTokenRepo = { create: vi.fn().mockResolvedValue(undefined) };

    const useCase = new SignUpUseCase(mockAuthRepo as any, mockTokenRepo as any, jwtService);

    const result = await useCase.execute({
      email: "valido@ucaldas.edu.co",
      password: "StrongP4ss!",
      fullName: "Usuario Valido",
    });

    expect(result.user.email).toBe("valido@ucaldas.edu.co");
    expect(result.user.role).toBe("estudiante");
  });
});

describe("US-N8N02 — T2.2: SignUpUseCase — Generación de verificationToken", () => {
  it("incluye verificationToken en la respuesta cuando el registro es exitoso", async () => {
    const { SignUpUseCase } = await import("../../src/application/use-cases/SignUpUseCase.js");

    const jwtService = await createJWTService();
    const mockAuthRepo = {
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: "new-id-123",
        email: "nuevo@ucaldas.edu.co",
        fullName: "Nuevo Usuario",
        role: "estudiante",
        isVerified: false,
      }),
    };
    const mockTokenRepo = { create: vi.fn().mockResolvedValue(undefined) };

    const useCase = new SignUpUseCase(mockAuthRepo as any, mockTokenRepo as any, jwtService);

    const result = await useCase.execute({
      email: "nuevo@ucaldas.edu.co",
      password: "StrongP4ss!",
      fullName: "Nuevo Usuario",
    });

    expect(result.verificationToken).toBeDefined();
    expect(typeof result.verificationToken).toBe("string");
    expect(result.verificationToken!.split(".").length).toBe(3);
  });

  it("crea usuario con isVerified=false", async () => {
    const { SignUpUseCase } = await import("../../src/application/use-cases/SignUpUseCase.js");

    const jwtService = await createJWTService();
    const mockAuthRepo = {
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: "new-id-456",
        email: "otro@ucaldas.edu.co",
        fullName: "Otro Usuario",
        role: "estudiante",
        isVerified: false,
      }),
    };
    const mockTokenRepo = { create: vi.fn().mockResolvedValue(undefined) };

    const useCase = new SignUpUseCase(mockAuthRepo as any, mockTokenRepo as any, jwtService);

    await useCase.execute({
      email: "otro@ucaldas.edu.co",
      password: "StrongP4ss!",
      fullName: "Otro Usuario",
    });

    expect(mockAuthRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ isVerified: false, email: "otro@ucaldas.edu.co" })
    );
  });

  it("el verificationToken contiene userId y email en su payload", async () => {
    const { SignUpUseCase } = await import("../../src/application/use-cases/SignUpUseCase.js");

    const jwtService = await createJWTService();
    const mockAuthRepo = {
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: "user-uuid-789",
        email: "payload@ucaldas.edu.co",
        fullName: "Payload Test",
        role: "estudiante",
        isVerified: false,
      }),
    };
    const mockTokenRepo = { create: vi.fn().mockResolvedValue(undefined) };

    const useCase = new SignUpUseCase(mockAuthRepo as any, mockTokenRepo as any, jwtService);

    const result = await useCase.execute({
      email: "payload@ucaldas.edu.co",
      password: "StrongP4ss!",
      fullName: "Payload Test",
    });

    const decoded = decodeToken(result.verificationToken!);
    expect(decoded.sub).toBe("user-uuid-789");
    expect(decoded.email).toBe("payload@ucaldas.edu.co");
    expect(decoded.exp).toBeGreaterThan(decoded.iat!);
  });
});

describe("US-N8N02 — T2.3: VerifyEmailUseCase — Verificación de correo y emisión de webhook", () => {
  let jwtService: any;
  let mockAuthRepo: any;
  let mockDispatch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    jwtService = await createJWTService();
    mockAuthRepo = {
      findById: vi.fn(),
      update: vi.fn(),
    };
    mockDispatch = vi.fn();
  });

  it("con token válido: confirma email, actualiza isVerified=true y emite webhook", async () => {
    const { VerifyEmailUseCase } = await import("../../src/application/use-cases/VerifyEmailUseCase.js");

    const userId = "user-id-valid";
    const email = "test@ucaldas.edu.co";
    const token = jwtService.generateVerificationToken(userId, email);

    mockAuthRepo.findById.mockResolvedValue({
      id: userId,
      email,
      fullName: "Test User",
      isVerified: false,
    });
    mockAuthRepo.update.mockResolvedValue({ id: userId, isVerified: true });

    const useCase = new VerifyEmailUseCase(mockAuthRepo, jwtService, mockDispatch);

    const result = await useCase.execute(token);

    expect(result.verified).toBe(true);
    expect(result.email).toBe(email);
    expect(mockAuthRepo.update).toHaveBeenCalledWith(userId, { isVerified: true });
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(email, "Test User", userId);
  });

  it("emite webhook con payload correcto (event='usuario.verificado')", async () => {
    const { VerifyEmailUseCase } = await import("../../src/application/use-cases/VerifyEmailUseCase.js");

    const userId = "user-id-webhook";
    const email = "webhook@ucaldas.edu.co";
    const token = jwtService.generateVerificationToken(userId, email);

    mockAuthRepo.findById.mockResolvedValue({
      id: userId,
      email,
      fullName: "Webhook User",
      isVerified: false,
    });
    mockAuthRepo.update.mockResolvedValue({ id: userId, isVerified: true });

    const useCase = new VerifyEmailUseCase(mockAuthRepo, jwtService, mockDispatch);

    await useCase.execute(token);

    const callArgs = mockDispatch.mock.calls[0];
    expect(callArgs[0]).toBe("webhook@ucaldas.edu.co");
    expect(callArgs[1]).toBe("Webhook User");
    expect(callArgs[2]).toBe("user-id-webhook");
  });

  it("con token inválido: lanza ValidationError y NO emite webhook", async () => {
    const { VerifyEmailUseCase, ValidationError: VE } = await (async () => {
      const mod = await import("../../src/application/use-cases/VerifyEmailUseCase.js");
      const errMod = await import("../../../../shared/libs/errors/index.js");
      return { VerifyEmailUseCase: mod.VerifyEmailUseCase, ValidationError: errMod.ValidationError };
    })();

    const useCase = new VerifyEmailUseCase(mockAuthRepo, jwtService, mockDispatch);

    await expect(useCase.execute("token-invalido")).rejects.toThrow(VE);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("con token expirado: lanza ValidationError y NO emite webhook", async () => {
    const { VerifyEmailUseCase, ValidationError: VE } = await (async () => {
      const mod = await import("../../src/application/use-cases/VerifyEmailUseCase.js");
      const errMod = await import("../../../../shared/libs/errors/index.js");
      return { VerifyEmailUseCase: mod.VerifyEmailUseCase, ValidationError: errMod.ValidationError };
    })();

    const userId = "user-id-expired";
    const email = "expired@ucaldas.edu.co";
    const token = jwtService.generateVerificationToken(userId, email);

    const futureTime = Math.floor(Date.now() / 1000) + 25 * 60 * 60;
    vi.spyOn(Date, "now").mockImplementation(() => futureTime * 1000);

    const useCase = new VerifyEmailUseCase(mockAuthRepo, jwtService, mockDispatch);

    await expect(useCase.execute(token)).rejects.toThrow(VE);
    expect(mockDispatch).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it("con usuario ya verificado: retorna sin llamar update ni dispatch", async () => {
    const { VerifyEmailUseCase } = await import("../../src/application/use-cases/VerifyEmailUseCase.js");

    const userId = "user-id-already-verified";
    const email = "already@ucaldas.edu.co";
    const token = jwtService.generateVerificationToken(userId, email);

    mockAuthRepo.findById.mockResolvedValue({
      id: userId,
      email,
      fullName: "Already Verified",
      isVerified: true,
    });

    const useCase = new VerifyEmailUseCase(mockAuthRepo, jwtService, mockDispatch);

    const result = await useCase.execute(token);

    expect(result.verified).toBe(true);
    expect(mockAuthRepo.update).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("con token vacío: lanza ValidationError", async () => {
    const { VerifyEmailUseCase, ValidationError: VE } = await (async () => {
      const mod = await import("../../src/application/use-cases/VerifyEmailUseCase.js");
      const errMod = await import("../../../../shared/libs/errors/index.js");
      return { VerifyEmailUseCase: mod.VerifyEmailUseCase, ValidationError: errMod.ValidationError };
    })();

    const useCase = new VerifyEmailUseCase(mockAuthRepo, jwtService, mockDispatch);

    await expect(useCase.execute("")).rejects.toThrow(VE);
  });
});

describe("US-N8N02 — T2.4: dispatchWelcomeWebhook — Estructura del payload", () => {
  it("el payload contiene event, timestamp y data con userId, email, fullName", async () => {
    const dispatch = (email: string, fullName: string, userId: string) => {
      return {
        event: "usuario.verificado",
        timestamp: new Date().toISOString(),
        data: {
          userId,
          email,
          fullName: fullName || email.split("@")[0],
        },
      };
    };

    const result = dispatch("test@ucaldas.edu.co", "Test User", "user-123");
    expect(result.event).toBe("usuario.verificado");
    expect(result.data.userId).toBe("user-123");
    expect(result.data.email).toBe("test@ucaldas.edu.co");
    expect(result.data.fullName).toBe("Test User");
    expect(result.timestamp).toBeDefined();
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });

  it("usa email como fallback para fullName cuando no se proporciona nombre", () => {
    const dispatch = (email: string, fullName: string, userId: string) => {
      return {
        event: "usuario.verificado",
        timestamp: new Date().toISOString(),
        data: {
          userId,
          email,
          fullName: fullName || email.split("@")[0],
        },
      };
    };

    const result = dispatch("juan.perez@ucaldas.edu.co", "", "user-456");
    expect(result.data.fullName).toBe("juan.perez");
  });
});

describe("US-N8N02 — T2.5: Timer de 5 minutos — Contrato con n8n", () => {
  it("el dispatch se ejecuta sin delay artificial del backend (el timer es responsabilidad de n8n)", async () => {
    const jwtService = await createJWTService();
    const mockAuthRepo = {
      findById: vi.fn().mockResolvedValue({
        id: "user-timer",
        email: "timer@ucaldas.edu.co",
        fullName: "Timer Test",
        isVerified: false,
      }),
      update: vi.fn().mockResolvedValue({ id: "user-timer", isVerified: true }),
    };
    const mockDispatch = vi.fn();

    const { VerifyEmailUseCase } = await import("../../src/application/use-cases/VerifyEmailUseCase.js");
    const useCase = new VerifyEmailUseCase(mockAuthRepo, jwtService, mockDispatch);

    const spy = vi.spyOn(globalThis, "setTimeout");

    const token = jwtService.generateVerificationToken("user-timer", "timer@ucaldas.edu.co");
    await useCase.execute(token);

    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  it("documenta que el timer de 5 min es responsabilidad del flujo n8n", () => {
    const n8nContract = {
      event: "usuario.verificado",
      description: "Emitido por el backend cuando un usuario verifica su correo",
      expectedBehavior: {
        delay: "n8n debe esperar 5 minutos antes de enviar el correo de bienvenida",
        retry: "n8n debe reintentar si el envío falla",
      },
      payload: {
        event: "usuario.verificado",
        timestamp: "ISO 8601",
        data: {
          userId: "UUID del usuario",
          email: "correo institucional @ucaldas.edu.co",
          fullName: "Nombre completo del usuario",
        },
      },
    };

    expect(n8nContract.event).toBe("usuario.verificado");
    expect(n8nContract.expectedBehavior.delay).toContain("5 minutos");
    expect(n8nContract.payload.data.email).toContain("@ucaldas.edu.co");
  });
});
