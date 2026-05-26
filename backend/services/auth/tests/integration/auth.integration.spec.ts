import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createAuthServer } from "../../src/app/createAuthServer.js";
import { AuthController } from "../../src/interfaces/http/AuthController.js";
import { RegisterContract } from "@uniconnect/shared-types/contracts/auth";

const mockSignUpUseCase = {
  execute: vi.fn().mockResolvedValue({
    user: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "nuevo@ucaldas.edu.co",
      fullName: "Nuevo Usuario",
      role: "estudiante" as const,
    },
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mocksig",
    refreshToken: "mock-refresh-token",
    expiresIn: 3600,
  }),
};

const mockSignInUseCase = { execute: vi.fn() };
const mockRefreshTokenUseCase = { execute: vi.fn() };

const authController = new AuthController(
  mockSignUpUseCase as any,
  mockSignInUseCase as any,
  mockRefreshTokenUseCase as any,
);

const server = createAuthServer(authController);

describe("POST /api/v1/auth/register — Integration (Sprint 4)", () => {
  it("C1: registra usuario válido y response cumple contrato", async () => {
    const res = await request(server as any)
      .post("/api/v1/auth/register")
      .send({ email: "nuevo@ucaldas.edu.co", password: "StrongP4ss!", fullName: "Nuevo Usuario" });

    expect(res.status).toBe(201);
    const result = RegisterContract.response.safeParse(res.body.data);
    expect(result.success).toBe(true);
  });

  it("C2: rechaza email inválido con 400", async () => {
    const res = await request(server as any)
      .post("/api/v1/auth/register")
      .send({ email: "invalido", password: "StrongP4ss!", fullName: "Test User" });

    expect(res.status).toBe(400);
  });

  it("C3: rechaza password débil con error de validación", async () => {
    const res = await request(server as any)
      .post("/api/v1/auth/register")
      .send({ email: "test@ucaldas.edu.co", password: "123", fullName: "Test User" });

    expect(res.status).toBe(400);
  });
});