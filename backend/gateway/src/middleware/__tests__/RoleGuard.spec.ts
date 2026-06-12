import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ServerResponse } from "node:http";
import { RoleGuard } from "../RoleGuard.js";
import type { JWTPayload } from "../JWTMiddleware.js";
import logger from "../../../../shared/libs/logging/Logger.js";

interface MockRes {
  statusCode: number;
  writeHead: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  setHeader: ReturnType<typeof vi.fn>;
  getHeader: ReturnType<typeof vi.fn>;
}

function createMockRes(): MockRes {
  let statusCode = 200;

  return {
    get statusCode() {
      return statusCode;
    },
    set statusCode(v: number) {
      statusCode = v;
    },
    writeHead: vi.fn((status: number) => {
      statusCode = status;
    }) as any,
    end: vi.fn() as any,
    setHeader: vi.fn() as any,
    getHeader: vi.fn() as any,
  };
}

describe("RoleGuard", () => {
  let guard: RoleGuard;
  let mockRes: MockRes;
  let loggerWarnSpy: any;

  beforeEach(() => {
    guard = new RoleGuard("super_admin");
    mockRes = createMockRes();
    loggerWarnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("C1: deniega acceso cuando no hay token (payload nulo)", () => {
    const result = guard.authorize(null, mockRes as unknown as ServerResponse);

    expect(result).toBe(false);
    expect(mockRes.statusCode).toBe(401);
  });

  it("C2: deniega acceso cuando el token no tiene role (payload inválido)", () => {
    const payload: JWTPayload = {
      sub: "user-123",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const result = guard.authorize(payload, mockRes as unknown as ServerResponse);

    expect(result).toBe(false);
    expect(mockRes.statusCode).toBe(403);
  });

  it("C3: deniega acceso cuando el role es 'user' (insuficiente)", () => {
    const payload: JWTPayload = {
      sub: "user-123",
      role: "user",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const result = guard.authorize(payload, mockRes as unknown as ServerResponse);

    expect(result).toBe(false);
    expect(mockRes.statusCode).toBe(403);
  });

  it("C4: permite acceso cuando el role es 'super_admin'", () => {
    const payload: JWTPayload = {
      sub: "admin-456",
      role: "super_admin",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const result = guard.authorize(payload, mockRes as unknown as ServerResponse);

    expect(result).toBe(true);
    expect(mockRes.statusCode).toBe(200);
  });

  it("C5: registra intento denegado en el log con userId y timestamp", () => {
    const payload: JWTPayload = {
      sub: "user-123",
      role: "user",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    guard.authorize(payload, mockRes as unknown as ServerResponse);

    expect(loggerWarnSpy).toHaveBeenCalledOnce();
    const logMessage = loggerWarnSpy.mock.calls[0][0];
    const logContext = loggerWarnSpy.mock.calls[0][1];
    const logData = loggerWarnSpy.mock.calls[0][2];

    expect(logMessage).toBe("Admin access denied");
    expect(logContext).toBe("RoleGuard");
    expect(logData).toHaveProperty("userId", "user-123");
    expect(logData).toHaveProperty("timestamp");
    expect(logData).toHaveProperty("role", "user");
  });

  it("C6: retorna HTTP 403 con mensaje 'Acceso restringido a super_admin'", () => {
    const payload: JWTPayload = {
      sub: "user-123",
      role: "estudiante",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    guard.authorize(payload, mockRes as unknown as ServerResponse);

    const endCalls = mockRes.end.mock.calls;
    const lastEndArg = endCalls[endCalls.length - 1][0];
    const body = JSON.parse(lastEndArg);
    expect(body).toHaveProperty("error", "Acceso restringido a super_admin");
  });

  it("C7: acepta role personalizado vía constructor", () => {
    const customGuard = new RoleGuard("admin");

    const payload: JWTPayload = {
      sub: "admin-789",
      role: "admin",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const result = customGuard.authorize(payload, mockRes as unknown as ServerResponse);
    expect(result).toBe(true);
  });
});
