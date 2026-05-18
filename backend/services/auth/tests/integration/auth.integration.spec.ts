import { describe, it, expect } from "vitest";
import { RegisterContract } from "@uniconnect/shared-types/contracts/auth";

describe("POST /api/v1/auth/register — Integration (Sprint 4)", () => {
  const BASE = "http://localhost:3102";

  it("C1: registra usuario válido y response cumple contrato", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nuevo@ucaldas.edu.co",
        password: "StrongP4ss!",
        fullName: "Nuevo Usuario",
      }),
    });

    if (res.status === 201) {
      const body = await res.json();
      const result = RegisterContract.response.safeParse(body.data);
      expect(result.success).toBe(true);
    } else {
      expect([409, 400]).toContain(res.status);
    }
  });

  it("C2: rechaza email inválido con 400", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "invalido",
        password: "StrongP4ss!",
        fullName: "Test User",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("C3: rechaza password débil con error de validación", async () => {
    const res = await fetch(`${BASE}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@ucaldas.edu.co",
        password: "123",
        fullName: "Test User",
      }),
    });
    expect(res.status).toBe(400);
  });
});
