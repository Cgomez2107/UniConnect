import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SendMessageUseCase } from "../src/application/use-cases/SendMessageUseCase.js";

const ORIGINAL_ENV = process.env;

describe("SendMessageUseCase", () => {
  let useCase: SendMessageUseCase;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.CHATBOT_WEBHOOK_URL;
    useCase = new SendMessageUseCase();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  describe("when CHATBOT_WEBHOOK_URL is not set (mock mode)", () => {
    it("should return a simulated response for estudiante role", async () => {
      const result = await useCase.execute("estudiante", "¿Cómo crear un grupo?");
      expect(result.reply).toContain("[Simulación Estudiante Bot]");
      expect(result.reply).toContain("UniConnect");
      expect(Array.isArray(result.referencias)).toBe(true);
    });

    it("should return a simulated response for admin role", async () => {
      const result = await useCase.execute("admin", "Mostrar logs del sistema");
      expect(result.reply).toContain("[Simulación Admin Bot]");
      expect(result.reply).toContain("sistema");
      expect(Array.isArray(result.referencias)).toBe(true);
    });
  });

  describe("when CHATBOT_WEBHOOK_URL is set", () => {
    const webhookUrl = "https://mock-n8n.example.com/webhook/chatbot";

    beforeEach(() => {
      process.env.CHATBOT_WEBHOOK_URL = webhookUrl;
    });

    it("should send correct payload {pregunta, rol, userId} to the webhook", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ reply: "Respuesta test", referencias: [{ id: "chunk-1", similarity: 0.85 }] }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await useCase.execute("estudiante", "¿Cómo crear un grupo?", [], "user-123");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pregunta: "¿Cómo crear un grupo?",
          rol: "estudiante",
          userId: "user-123",
        }),
      });
    });

    it("should return reply and referencias on successful response", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          reply: "Para crear un grupo ve a la sección Grupos de Estudio.",
          referencias: [
            { id: "chunk-1", source: "Manual UniConnect", similarity: 0.92 },
          ],
        }),
      }));

      const result = await useCase.execute("estudiante", "¿Cómo crear un grupo?");
      expect(result.reply).toBe("Para crear un grupo ve a la sección Grupos de Estudio.");
      expect(result.referencias).toHaveLength(1);
      expect(result.referencias[0].similarity).toBe(0.92);
    });

    it("should handle response with reply field in alternate format", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ response: "Respuesta desde response field", referencias: [] }),
      }));

      const result = await useCase.execute("estudiante", "consulta");
      expect(result.reply).toBe("Respuesta desde response field");
    });

    it("should fallback to error message when webhook returns non-ok status", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      }));

      const result = await useCase.execute("estudiante", "consulta");
      expect(result.reply).toContain("[Error de Conexión]");
      expect(result.referencias).toEqual([]);
    });

    it("should fallback to error message when fetch throws", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

      const result = await useCase.execute("admin", "consulta");
      expect(result.reply).toContain("ECONNREFUSED");
      expect(result.reply).toContain("[Error de Conexión]");
    });

    it("should handle webhook timeout gracefully", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("The operation was aborted due to timeout")));

      const result = await useCase.execute("estudiante", "consulta lenta");
      expect(result.reply).toContain("[Error de Conexión]");
    });

    it("should pass userId as empty string when not provided", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ reply: "ok", referencias: [] }),
      });
      vi.stubGlobal("fetch", mockFetch);

      await useCase.execute("estudiante", "consulta");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.userId).toBe("");
    });
  });

  describe("when CHATBOT_WEBHOOK_URL points to webhook.site (mock mode)", () => {
    it("should use mock response instead of calling real webhook", async () => {
      process.env.CHATBOT_WEBHOOK_URL = "https://webhook.site/abc-123";

      const result = await useCase.execute("estudiante", "consulta");
      expect(result.reply).toContain("[Simulación Estudiante Bot]");
    });
  });
});
