import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeError } from "../sanitizeError.js";

describe("sanitizeError", () => {
  it("redacta claves SendGrid (SG.xxx)", () => {
    const result = sanitizeError("My key is SG.abc123.xyz and it's secret");
    assert.ok(result.includes("SG.**REDACTED**"));
    assert.ok(!result.includes("SG.abc123.xyz"));
  });

  it("redacta URLs https", () => {
    const result = sanitizeError("Error at https://api.sendgrid.com/v3/mail");
    assert.ok(result.includes("***REDACTED_URL***"));
    assert.ok(!result.includes("api.sendgrid.com"));
  });

  it("redacta URLs http", () => {
    const result = sanitizeError("Callback at http://localhost:3000/callback");
    assert.ok(result.includes("***REDACTED_URL***"));
  });

  it("redacta rutas Windows (C:\...)", () => {
    const result = sanitizeError("File not found at C:\\Users\\test\\config.json");
    assert.ok(result.includes("***REDACTED_PATH***"));
    assert.ok(!result.includes("Users"));
  });

  it("redacta rutas Unix (/...) quando aparecem na mensagem", () => {
    const result = sanitizeError("Path /etc/ssl/certs/ca-certificates.crt not found");
    assert.ok(result.includes("***REDACTED_PATH***"));
  });

  it("toleraceia a objetos Error", () => {
    const err = new Error("SG.abc.def https://evil.com C:\\secrets");
    const result = sanitizeError(err);
    assert.ok(result.includes("SG.**REDACTED**"));
    assert.ok(result.includes("***REDACTED_URL***"));
    assert.ok(result.includes("***REDACTED_PATH***"));
  });

  it("retorna 'Unknown error' para null", () => {
    assert.equal(sanitizeError(null), "Unknown error");
  });

  it("retorna 'Unknown error' para undefined", () => {
    assert.equal(sanitizeError(undefined), "Unknown error");
  });

  it("trata strings diretamente", () => {
    assert.equal(sanitizeError("simple message"), "simple message");
  });

  it("redacta múltiplas ocorrências do mesmo padrão", () => {
    const result = sanitizeError("SG.key1 and SG.key2");
    const matches = result.match(/SG\.\*\*REDACTED\*\*/g);
    assert.equal(matches?.length, 2);
  });
});
