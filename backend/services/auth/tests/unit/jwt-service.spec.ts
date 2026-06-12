import { describe, it, expect, vi } from "vitest";
import { JWTService } from "../../src/infrastructure/jwt/JWTService.js";
import { AuthenticationError } from "../../../../shared/libs/errors/index.js";

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn().mockResolvedValue(true),
    hash: vi.fn().mockResolvedValue("$2a$10$mockedhash"),
  },
  compare: vi.fn().mockResolvedValue(true),
  hash: vi.fn().mockResolvedValue("$2a$10$mockedhash"),
}));

const TEST_SECRET = "test-secret-for-unit-tests-at-least-32-chars!!";

function decodeToken(token: string): Record<string, unknown> {
  const parts = token.split(".");
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
  return payload;
}

describe("JWTService — T1.1: JWT payload con role", () => {
  it("incluye role en el payload del access token cuando se proporciona", () => {
    const service = new JWTService(TEST_SECRET, TEST_SECRET);
    const { accessToken } = service.generateTokens("user-123", "admin");
    const payload = decodeToken(accessToken);
    expect(payload.sub).toBe("user-123");
    expect(payload.role).toBe("admin");
    expect(payload.jti).toBeDefined();
    expect(payload.iat).toBeDefined();
    expect(payload.exp).toBeDefined();
  });

  it("incluye role en el payload del refresh token cuando se proporciona", () => {
    const service = new JWTService(TEST_SECRET, TEST_SECRET);
    const { refreshToken } = service.generateTokens("user-123", "admin");
    const payload = decodeToken(refreshToken);
    expect(payload.sub).toBe("user-123");
    expect(payload.role).toBe("admin");
  });

  it("NO incluye role en el payload cuando se omite el parámetro", () => {
    const service = new JWTService(TEST_SECRET, TEST_SECRET);
    const { accessToken } = service.generateTokens("user-123");
    const payload = decodeToken(accessToken);
    expect(payload.sub).toBe("user-123");
    expect(payload.role).toBeUndefined();
  });

  it("NO incluye role en el payload cuando se pasa undefined", () => {
    const service = new JWTService(TEST_SECRET, TEST_SECRET);
    const { accessToken } = service.generateTokens("user-123", undefined);
    const payload = decodeToken(accessToken);
    expect(payload.role).toBeUndefined();
  });

  it("NO incluye role en el payload cuando se pasa string vacío", () => {
    const service = new JWTService(TEST_SECRET, TEST_SECRET);
    const { accessToken } = service.generateTokens("user-123", "");
    const payload = decodeToken(accessToken);
    expect(payload.role).toBeUndefined();
  });

  it("verifyAccessToken retorna el payload completo con role", () => {
    const service = new JWTService(TEST_SECRET, TEST_SECRET);
    const { accessToken } = service.generateTokens("user-456", "admin");
    const payload = service.verifyAccessToken(accessToken);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe("user-456");
    expect(payload!.role).toBe("admin");
  });

  it("verifyAccessToken retorna null para token inválido", () => {
    const service = new JWTService(TEST_SECRET, TEST_SECRET);
    const payload = service.verifyAccessToken("invalid-token");
    expect(payload).toBeNull();
  });
});

describe("SignInUseCase — T1.2: Validación de dominio institucional", () => {
  it("rechaza email que no termina en @ucaldas.edu.co con ValidationError", async () => {
    const { SignInUseCase, ValidationError: VE } = await (async () => {
      const mod = await import("../../src/application/use-cases/SignInUseCase.js");
      const errMod = await import("../../../../shared/libs/errors/index.js");
      return { SignInUseCase: mod.SignInUseCase, ValidationError: errMod.ValidationError };
    })();

    const useCase = new SignInUseCase(
      {} as any, {} as any, {} as any,
    );

    await expect(useCase.execute({ email: "usuario@gmail.com", password: "password123" }))
      .rejects.toThrow(VE);
  });

  it("rechaza email público como outlook.com con ValidationError", async () => {
    const { SignInUseCase, ValidationError: VE } = await (async () => {
      const mod = await import("../../src/application/use-cases/SignInUseCase.js");
      const errMod = await import("../../../../shared/libs/errors/index.js");
      return { SignInUseCase: mod.SignInUseCase, ValidationError: errMod.ValidationError };
    })();

    const useCase = new SignInUseCase(
      {} as any, {} as any, {} as any,
    );

    await expect(useCase.execute({ email: "test@outlook.com", password: "password123" }))
      .rejects.toThrow(VE);
  });
});

describe("SignInUseCase — T1.2: Propaga role a generateTokens", () => {
  it("llama generateTokens con el userId y el role del usuario (Supabase fallback)", async () => {
    const mockJWTService = { generateTokens: vi.fn().mockReturnValue({ accessToken: "at", refreshToken: "rt", accessTokenExpiry: 3600 }) };
    const mockAuthRepository = { findByEmail: vi.fn().mockResolvedValue(null) };
    const mockTokenRepository = { create: vi.fn().mockResolvedValue(undefined) };

    const { SignInUseCase } = await import("../../src/application/use-cases/SignInUseCase.js");
    const useCase = new SignInUseCase(
      mockAuthRepository as any, mockTokenRepository as any, mockJWTService,
      "https://supabase.test", "service-role-key",
    );

    const mockSupabaseUser = { id: "supabase-id" };
    vi.spyOn(useCase as any, "verifyWithSupabaseAuth").mockResolvedValue(mockSupabaseUser);
    vi.spyOn(useCase as any, "fetchRoleFromProfiles").mockResolvedValue("admin");

    await useCase.execute({ email: "admin@ucaldas.edu.co", password: "password123" });

    expect(mockJWTService.generateTokens).toHaveBeenCalledWith("supabase-id", "admin");
  });

  it("llama generateTokens con role='estudiante' cuando el perfil no tiene role", async () => {
    const mockJWTService = { generateTokens: vi.fn().mockReturnValue({ accessToken: "at", refreshToken: "rt", accessTokenExpiry: 3600 }) };
    const mockAuthRepository = { findByEmail: vi.fn().mockResolvedValue(null) };
    const mockTokenRepository = { create: vi.fn().mockResolvedValue(undefined) };

    const { SignInUseCase } = await import("../../src/application/use-cases/SignInUseCase.js");
    const useCase = new SignInUseCase(
      mockAuthRepository as any, mockTokenRepository as any, mockJWTService,
      "https://supabase.test", "service-role-key",
    );

    const mockSupabaseUser = { id: "supabase-id" };
    vi.spyOn(useCase as any, "verifyWithSupabaseAuth").mockResolvedValue(mockSupabaseUser);
    vi.spyOn(useCase as any, "fetchRoleFromProfiles").mockResolvedValue(null);

    await useCase.execute({ email: "test@ucaldas.edu.co", password: "password123" });

    expect(mockJWTService.generateTokens).toHaveBeenCalledWith("supabase-id", "estudiante");
  });

  it("llama generateTokens con el role del usuario en login local", async () => {
    const mockJWTService = { generateTokens: vi.fn().mockReturnValue({ accessToken: "at", refreshToken: "rt", accessTokenExpiry: 3600 }) };
    const mockAuthRepository = {
      findByEmail: vi.fn().mockResolvedValue({
        id: "local-id", email: "local@ucaldas.edu.co", fullName: "Local",
        passwordHash: "$2a$10$hashed", role: "admin", isActive: true,
      }),
    };
    const mockTokenRepository = { create: vi.fn().mockResolvedValue(undefined) };

    const { SignInUseCase } = await import("../../src/application/use-cases/SignInUseCase.js");
    const useCase = new SignInUseCase(mockAuthRepository as any, mockTokenRepository as any, mockJWTService);

    await useCase.execute({ email: "local@ucaldas.edu.co", password: "password123" });

    expect(mockJWTService.generateTokens).toHaveBeenCalledWith("local-id", "admin");
  });
});

describe("SignUpUseCase — T1.3: Validación de dominio institucional", () => {
  it("rechaza email @gmail.com con ValidationError", async () => {
    const { SignUpUseCase, ValidationError: VE } = await (async () => {
      const mod = await import("../../src/application/use-cases/SignUpUseCase.js");
      const errMod = await import("../../../../shared/libs/errors/index.js");
      return { SignUpUseCase: mod.SignUpUseCase, ValidationError: errMod.ValidationError };
    })();

    const mockJWTService = { generateTokens: vi.fn() };
    const mockAuthRepository = { findByEmail: vi.fn(), create: vi.fn() };
    const mockTokenRepository = { create: vi.fn() };

    const useCase = new SignUpUseCase(
      mockAuthRepository as any, mockTokenRepository as any, mockJWTService,
    );

    await expect(useCase.execute({ email: "usuario@gmail.com", password: "StrongP4ss!", fullName: "Test" }))
      .rejects.toThrow(VE);
  });

  it("rechaza email @hotmail.com con ValidationError", async () => {
    const { SignUpUseCase, ValidationError: VE } = await (async () => {
      const mod = await import("../../src/application/use-cases/SignUpUseCase.js");
      const errMod = await import("../../../../shared/libs/errors/index.js");
      return { SignUpUseCase: mod.SignUpUseCase, ValidationError: errMod.ValidationError };
    })();

    const mockJWTService = { generateTokens: vi.fn() };
    const mockAuthRepository = { findByEmail: vi.fn(), create: vi.fn() };
    const mockTokenRepository = { create: vi.fn() };

    const useCase = new SignUpUseCase(
      mockAuthRepository as any, mockTokenRepository as any, mockJWTService,
    );

    await expect(useCase.execute({ email: "test@hotmail.com", password: "StrongP4ss!", fullName: "Test" }))
      .rejects.toThrow(VE);
  });

  it("acepta email @ucaldas.edu.co (happy path)", async () => {
    const { SignUpUseCase } = await import("../../src/application/use-cases/SignUpUseCase.js");

    const mockJWTService = { generateTokens: vi.fn().mockReturnValue({ accessToken: "at", refreshToken: "rt", accessTokenExpiry: 3600 }) };
    const mockAuthRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "new-id", email: "valido@ucaldas.edu.co", fullName: "Valido", role: "estudiante" }),
    };
    const mockTokenRepository = { create: vi.fn().mockResolvedValue(undefined) };

    const useCase = new SignUpUseCase(
      mockAuthRepository as any, mockTokenRepository as any, mockJWTService,
    );

    const result = await useCase.execute({ email: "valido@ucaldas.edu.co", password: "StrongP4ss!", fullName: "Usuario Valido" });
    expect(result.user.email).toBe("valido@ucaldas.edu.co");
  });
});

describe("SignUpUseCase — T1.3: Propaga role a generateTokens", () => {
  it("llama generateTokens con user.id y user.role después de crear usuario", async () => {
    const mockJWTService = { generateTokens: vi.fn().mockReturnValue({ accessToken: "at", refreshToken: "rt", accessTokenExpiry: 3600 }) };
    const mockAuthRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "new-id", email: "new@ucaldas.edu.co", fullName: "New", role: "estudiante" }),
    };
    const mockTokenRepository = { create: vi.fn().mockResolvedValue(undefined) };

    const { SignUpUseCase } = await import("../../src/application/use-cases/SignUpUseCase.js");
    const useCase = new SignUpUseCase(mockAuthRepository as any, mockTokenRepository as any, mockJWTService);

    await useCase.execute({ email: "new@ucaldas.edu.co", password: "StrongP4ss!", fullName: "New User" });

    expect(mockJWTService.generateTokens).toHaveBeenCalledWith("new-id", "estudiante");
  });
});

describe("RefreshTokenUseCase — T1.4: Propaga role a generateTokens", () => {
  it("llama generateTokens con user.id y user.role cuando el refresh token es válido", async () => {
    const mockJWTService = { generateTokens: vi.fn().mockReturnValue({ accessToken: "at", refreshToken: "rt", accessTokenExpiry: 3600 }) };
    const mockTokenRepository = {
      findByToken: vi.fn().mockResolvedValue({ userId: "user-id", expiresAt: new Date(Date.now() + 3600000), revokedAt: null }),
      create: vi.fn().mockResolvedValue(undefined),
    };
    const mockAuthRepository = {
      findById: vi.fn().mockResolvedValue({ id: "user-id", email: "test@ucaldas.edu.co", fullName: "Test", role: "admin" }),
    };

    const { RefreshTokenUseCase } = await import("../../src/application/use-cases/RefreshTokenUseCase.js");
    const useCase = new RefreshTokenUseCase(mockTokenRepository as any, mockAuthRepository as any, mockJWTService);

    await useCase.execute({ refreshToken: "valid-refresh-token" });

    expect(mockAuthRepository.findById).toHaveBeenCalledWith("user-id");
    expect(mockJWTService.generateTokens).toHaveBeenCalledWith("user-id", "admin");
  });

  it("lanza AuthenticationError cuando el refresh token está expirado", async () => {
    const mockJWTService = { generateTokens: vi.fn() };
    const mockTokenRepository = {
      findByToken: vi.fn().mockResolvedValue({ userId: "user-id", expiresAt: new Date(Date.now() - 3600000), revokedAt: null }),
    };
    const mockAuthRepository = { findById: vi.fn() };

    const { RefreshTokenUseCase } = await import("../../src/application/use-cases/RefreshTokenUseCase.js");
    const useCase = new RefreshTokenUseCase(mockTokenRepository as any, mockAuthRepository as any, mockJWTService);

    await expect(useCase.execute({ refreshToken: "expired-token" })).rejects.toThrow(AuthenticationError);
    expect(mockJWTService.generateTokens).not.toHaveBeenCalled();
  });
});
