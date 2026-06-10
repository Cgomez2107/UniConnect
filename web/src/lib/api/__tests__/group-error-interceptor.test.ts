import { describe, it, expect } from "vitest";
import { parseGroupError } from "../groupErrorInterceptor";

describe("parseGroupError", () => {
  it("should return spam message for MO_003 errors", () => {
    const error = {
      response: {
        data: { error: "Has enviado demasiados mensajes. Chat suspendido por 5 minutos.", code: "MO_003" },
      },
    };
    const result = parseGroupError(error);
    expect(result).toContain("demasiados mensajes");
    expect(result).toContain("suspendido");
  });

  it("should return escalation message for MO_004 errors", () => {
    const error = {
      response: {
        data: { error: "Has acumulado múltiples infracciones. Tu caso ha sido escalado a revisión humana.", code: "MO_004" },
      },
    };
    const result = parseGroupError(error);
    expect(result).toContain("escalado a revisión humana");
  });

  it("should return forbidden content message for MO_002 errors", () => {
    const error = {
      response: {
        data: { error: "palabras prohibidas detectadas", code: "MO_002" },
      },
    };
    const result = parseGroupError(error);
    expect(result).toContain("palabras prohibidas");
  });

  it("should return length error message for MO_001 errors", () => {
    const error = {
      response: {
        data: { error: "El mensaje excede el límite permitido de caracteres.", code: "MO_001" },
      },
    };
    const result = parseGroupError(error);
    expect(result).toContain("límite permitido");
  });

  it("should return generic error for unknown errors", () => {
    const result = parseGroupError(null);
    expect(result).toBe("Ha ocurrido un error inesperado. Intenta de nuevo.");
  });

  it("should extract message from Axios-like error object", () => {
    const error = new Error("Custom error message");
    const result = parseGroupError(error);
    expect(result).toBe("Custom error message");
  });
});
