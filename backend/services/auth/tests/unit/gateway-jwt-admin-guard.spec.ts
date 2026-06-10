import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { IncomingMessage, ServerResponse } from "node:http";
import jwt from "jsonwebtoken";

const TEST_SECRET = "test-secret-for-unit-tests-at-least-32-chars!!";

function createMockReq(headers: Record<string, string | undefined>, url = "/api/v1/events"): IncomingMessage {
  return {
    headers,
    url,
  } as unknown as IncomingMessage;
}

function createMockRes(): ServerResponse {
  const chunks: unknown[] = [];
  return {
    writeHead: vi.fn().mockReturnThis(),
    end: vi.fn((chunk?: unknown) => { if (chunk) chunks.push(chunk); }),
    setHeader: vi.fn(),
    getHeader: vi.fn(),
    statusCode: 200,
  } as unknown as ServerResponse;
}

function generateToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, TEST_SECRET, { algorithm: "HS256" });
}

// ────────────────────────────────────────────────────────────────────────────
// Bloque 2: Gateway — JWTMiddleware
// ────────────────────────────────────────────────────────────────────────────

describe("Bloque 2: Gateway — JWTMiddleware", () => {
  let JWTMiddleware: any;

  beforeAll(async () => {
    const mod = await import("../../../../gateway/src/middleware/JWTMiddleware.js");
    JWTMiddleware = mod.JWTMiddleware;
  });

  it("T2.1 authenticate: retorna payload cuando el token es válido", async () => {
    const middleware = new JWTMiddleware(TEST_SECRET);
    const token = generateToken({ sub: "user-123", role: "admin", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 });
    const req = createMockReq({ authorization: `Bearer ${token}` });
    const res = createMockRes();

    const payload = await middleware.authenticate(req, res);

    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe("user-123");
    expect(payload!.role).toBe("admin");
    expect(res.writeHead).not.toHaveBeenCalled();
  });

  it("T2.1 authenticate: retorna payload con role para token con role", async () => {
    const middleware = new JWTMiddleware(TEST_SECRET);
    const now = Math.floor(Date.now() / 1000);
    const token = generateToken({ sub: "user-456", role: "admin", iat: now, exp: now + 3600 });
    const req = createMockReq({ authorization: `Bearer ${token}` });
    const res = createMockRes();

    const payload = await middleware.authenticate(req, res);

    expect(payload).not.toBeNull();
    expect(payload!.role).toBe("admin");
  });

  it("T2.1 authenticate: retorna payload sin role cuando el token no lo incluye", async () => {
    const middleware = new JWTMiddleware(TEST_SECRET);
    const now = Math.floor(Date.now() / 1000);
    const token = generateToken({ sub: "user-789", iat: now, exp: now + 3600 });
    const req = createMockReq({ authorization: `Bearer ${token}` });
    const res = createMockRes();

    const payload = await middleware.authenticate(req, res);

    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe("user-789");
    expect(payload!.role).toBeUndefined();
  });

  it("T2.1 authenticate: retorna null y 401 cuando no hay token", async () => {
    const middleware = new JWTMiddleware(TEST_SECRET);
    const req = createMockReq({});
    const res = createMockRes();

    const payload = await middleware.authenticate(req, res);

    expect(payload).toBeNull();
    expect(res.writeHead).toHaveBeenCalledWith(401, expect.any(Object));
  });

  it("T2.1 authenticate: retorna null y 401 para token malformado", async () => {
    const middleware = new JWTMiddleware(TEST_SECRET);
    const req = createMockReq({ authorization: "Bearer not-a-valid-token" });
    const res = createMockRes();

    const payload = await middleware.authenticate(req, res);

    expect(payload).toBeNull();
    expect(res.writeHead).toHaveBeenCalledWith(401, expect.any(Object));
  });

  it("T2.1 authenticate: retorna null y 401 para token expirado", async () => {
    const middleware = new JWTMiddleware(TEST_SECRET);
    const past = Math.floor(Date.now() / 1000) - 10000;
    const token = generateToken({ sub: "user-expired", iat: past - 3600, exp: past });
    const req = createMockReq({ authorization: `Bearer ${token}` });
    const res = createMockRes();

    const payload = await middleware.authenticate(req, res);

    expect(payload).toBeNull();
    expect(res.writeHead).toHaveBeenCalledWith(401, expect.any(Object));
  });

  it("T2.1 authenticate: retorna null y 401 para token con firma inválida", async () => {
    const middleware = new JWTMiddleware(TEST_SECRET);
    const wrongSecretToken = jwt.sign(
      { sub: "hacker" },
      "wrong-secret-key!!!!!!!",
      { algorithm: "HS256" },
    );
    const req = createMockReq({ authorization: `Bearer ${wrongSecretToken}` });
    const res = createMockRes();

    const payload = await middleware.authenticate(req, res);

    expect(payload).toBeNull();
    expect(res.writeHead).toHaveBeenCalledWith(401, expect.any(Object));
  });

  it("T2.1 authenticate: extrae token de cookie cuando no hay Authorization header", async () => {
    const middleware = new JWTMiddleware(TEST_SECRET);
    const now = Math.floor(Date.now() / 1000);
    const token = generateToken({ sub: "user-cookie", role: "admin", iat: now, exp: now + 3600 });
    const req = createMockReq({ cookie: `auth_token=${token}` });
    const res = createMockRes();

    const payload = await middleware.authenticate(req, res);

    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe("user-cookie");
    expect(payload!.role).toBe("admin");
  });

  it("T2.1 getToken: retorna null cuando no hay token ni cookie", () => {
    const middleware = new JWTMiddleware(TEST_SECRET);
    const req = createMockReq({});

    const token = middleware.getToken(req);

    expect(token).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Bloque 3: Shared AdminGuard
// ────────────────────────────────────────────────────────────────────────────

describe("Bloque 3: Shared AdminGuard — requireRole", () => {
  let requireRole: any;
  let AuthorizationErrorClass: any;

  beforeAll(async () => {
    const mod = await import("../../../../shared/middleware/adminGuard.js");
    requireRole = mod.requireRole;

    const errors = await import("../../../../shared/libs/errors/AuthorizationError.js");
    AuthorizationErrorClass = errors.AuthorizationError;
  });

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("T3.1 requireRole('admin'): retorna true cuando x-user-role es 'admin'", () => {
    const guard = requireRole("admin");
    const req = createMockReq({ "x-user-role": "admin", "x-user-id": "user-123" }, "/api/v1/events");
    const res = createMockRes();

    const result = guard(req, res);

    expect(result).toBe(true);
  });

  it("T3.1 requireRole('admin'): lanza AuthorizationError cuando x-user-role es 'estudiante'", () => {
    const guard = requireRole("admin");
    const req = createMockReq({ "x-user-role": "estudiante", "x-user-id": "user-456" }, "/api/v1/events");
    const res = createMockRes();

    expect(() => guard(req, res)).toThrow(AuthorizationErrorClass);
    try { guard(req, res); } catch (e: any) {
      expect(e.message).toBe("Acceso restringido a super_admin");
      expect(e.statusCode).toBe(403);
    }
  });

  it("T3.1 requireRole('admin'): lanza AuthorizationError cuando falta x-user-role", () => {
    const guard = requireRole("admin");
    const req = createMockReq({ "x-user-id": "user-789" }, "/api/v1/events");
    const res = createMockRes();

    expect(() => guard(req, res)).toThrow(AuthorizationErrorClass);
    try { guard(req, res); } catch (e: any) {
      expect(e.message).toBe("Acceso restringido a super_admin");
      expect(e.statusCode).toBe(403);
    }
  });

  it("T3.1 requireRole('admin'): lanza AuthorizationError cuando x-user-role es string vacío", () => {
    const guard = requireRole("admin");
    const req = createMockReq({ "x-user-role": "", "x-user-id": "user-abc" }, "/api/v1/events");
    const res = createMockRes();

    expect(() => guard(req, res)).toThrow(AuthorizationErrorClass);
  });

  it("T3.1 requireRole('admin'): retorna true para super_admin (hereda permisos)", () => {
    const guard = requireRole("admin");
    const req = createMockReq({ "x-user-role": "super_admin", "x-user-id": "user-super" }, "/api/v1/events");
    const res = createMockRes();

    const result = guard(req, res);

    expect(result).toBe(true);
  });

  it("T3.1 requireRole('super_admin'): retorna true solo para rol super_admin", () => {
    const guard = requireRole("super_admin");
    const req = createMockReq({ "x-user-role": "super_admin", "x-user-id": "user-super" }, "/api/v1/events");
    const res = createMockRes();

    const result = guard(req, res);

    expect(result).toBe(true);
  });

  it("T3.1 requireRole('super_admin'): lanza AuthorizationError para admin cuando se requiere super_admin", () => {
    const guard = requireRole("super_admin");
    const req = createMockReq({ "x-user-role": "admin", "x-user-id": "user-admin" }, "/api/v1/events");
    const res = createMockRes();

    expect(() => guard(req, res)).toThrow(AuthorizationErrorClass);
  });

  it("T3.1 requireRole('admin'): registra log con userId, ruta y timestamp en intento fallido", () => {
    const guard = requireRole("admin");
    const req = createMockReq({ "x-user-role": "estudiante", "x-user-id": "user-456" }, "/api/v1/events/publish");
    const res = createMockRes();

    try { guard(req, res); } catch { /* expected */ }

    expect(console.log).toHaveBeenCalledTimes(1);
    const logArg = JSON.parse((console.log as any).mock.calls[0][0]);
    expect(logArg.userId).toBe("user-456");
    expect(logArg.ruta).toBe("/api/v1/events/publish");
    expect(logArg.timestamp).toBeDefined();
    expect(new Date(logArg.timestamp).toISOString()).toBe(logArg.timestamp);
  });

  it("T3.1 requireRole('admin'): registra log con userId='unknown' cuando no hay userId", () => {
    const guard = requireRole("admin");
    const req = createMockReq({}, "/api/v1/admin/events");
    const res = createMockRes();

    try { guard(req, res); } catch { /* expected */ }

    expect(console.log).toHaveBeenCalledTimes(1);
    const logArg = JSON.parse((console.log as any).mock.calls[0][0]);
    expect(logArg.userId).toBe("unknown");
    expect(logArg.ruta).toBe("/api/v1/admin/events");
  });

  it("T3.2: AuthorizationError tiene statusCode=403", async () => {
    const err = new AuthorizationErrorClass("Acceso restringido a super_admin");

    expect(err.statusCode).toBe(403);
    expect(err.message).toBe("Acceso restringido a super_admin");
    expect(err.name).toBe("AuthorizationError");
  });
});
