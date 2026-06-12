import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import type { Server } from "node:http";
import { createGatewayServer } from "../app/createGatewayServer.js";
import type { GatewayEnv } from "../shared/config/env.js";
import logger from "../../../shared/libs/logging/Logger.js";

const TEST_SECRET = "test-secret-for-uniconnect-gateway-e2e";

function buildEnv(overrides?: Partial<GatewayEnv>): GatewayEnv {
  return {
    port: 0,
    nodeEnv: "test",
    studyGroupsBaseUrl: "http://localhost:3101",
    resourcesBaseUrl: "http://localhost:3103",
    messagingBaseUrl: "http://localhost:3104",
    profilesCatalogBaseUrl: "http://localhost:3105",
    eventsBaseUrl: "http://localhost:3106",
    authBaseUrl: "http://localhost:3102",
    forumBaseUrl: "http://localhost:3107",
    jwtAccessSecret: TEST_SECRET,
    ...overrides,
  };
}

function signToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, TEST_SECRET, { algorithm: "HS256" });
}

describe("Admin routes — E2E (US-EV01)", () => {
  let server: Server;

  beforeAll(() => {
    const env = buildEnv();
    server = createGatewayServer(env) as unknown as Server;
  });

  afterAll(() => {
    server.close();
  });

  it("C1: GET /api/v1/admin/settings sin token retorna 401", async () => {
    const res = await request(server as any)
      .get("/api/v1/admin/settings")
      .expect(401);

    expect(res.body).toHaveProperty("error");
  });

  it("C2: GET /api/v1/admin/settings con token de role 'user' retorna 403 con mensaje esperado", async () => {
    const token = signToken({
      sub: "user-123",
      role: "user",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await request(server as any)
      .get("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);

    expect(res.body).toEqual({ error: "Acceso restringido a super_admin" });
  });

  it("C3: GET /api/v1/admin/settings con token de role 'user' registra log de auditoría", async () => {
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

    const token = signToken({
      sub: "user-456",
      role: "user",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    await request(server as any)
      .get("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);

    expect(warnSpy).toHaveBeenCalled();
    const logCall = warnSpy.mock.calls.find((call) =>
      String(call[0]).includes("Admin access denied")
    );
    expect(logCall).toBeDefined();
    expect(logCall![2]).toHaveProperty("userId", "user-456");
    expect(logCall![2]).toHaveProperty("timestamp");

    warnSpy.mockRestore();
  });

  it("C4: POST /api/v1/admin/users sin token retorna 401", async () => {
    const res = await request(server as any)
      .post("/api/v1/admin/users")
      .send({ email: "test@test.com" })
      .expect(401);

    expect(res.body).toHaveProperty("error");
  });

  it("C5: POST /api/v1/admin/users con token inválido (malformed) retorna 401", async () => {
    const res = await request(server as any)
      .post("/api/v1/admin/users")
      .set("Authorization", "Bearer invalid-token-format")
      .send({ email: "test@test.com" })
      .expect(401);

    expect(res.body).toHaveProperty("error");
  });

  it("C6: POST /api/v1/admin/users con role 'estudiante' retorna 403", async () => {
    const token = signToken({
      sub: "student-789",
      role: "estudiante",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await request(server as any)
      .post("/api/v1/admin/users")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);

    expect(res.body).toEqual({ error: "Acceso restringido a super_admin" });
  });
});
