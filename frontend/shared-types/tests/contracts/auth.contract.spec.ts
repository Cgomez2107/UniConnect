import { describe, it, expect } from "vitest";
import { LoginContract, RegisterContract } from "../../src/api/auth.contract.js";

describe("Auth Contract: POST /api/v1/auth/login", () => {
  it("rechaza body vacío", () => {
    const result = LoginContract.request.safeParse({ body: {} });
    expect(result.success).toBe(false);
  });

  it("rechaza email inválido", () => {
    const result = LoginContract.request.safeParse({
      body: { email: "not-an-email", password: "123456" },
    });
    expect(result.success).toBe(false);
  });

  it("acepta request válido", () => {
    const result = LoginContract.request.safeParse({
      body: { email: "test@ucaldas.edu.co", password: "123456" },
    });
    expect(result.success).toBe(true);
  });
});

describe("Auth Contract: POST /api/v1/auth/register", () => {
  it("rechaza body vacío", () => {
    const result = RegisterContract.request.safeParse({ body: {} });
    expect(result.success).toBe(false);
  });

  it("rechaza password corto", () => {
    const result = RegisterContract.request.safeParse({
      body: { email: "test@ucaldas.edu.co", password: "123", fullName: "Test User" },
    });
    expect(result.success).toBe(false);
  });

  it("acepta registro válido", () => {
    const result = RegisterContract.request.safeParse({
      body: { email: "test@ucaldas.edu.co", password: "StrongP4ss!", fullName: "Test User" },
    });
    expect(result.success).toBe(true);
  });
});
