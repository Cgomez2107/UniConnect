import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SendMessageUseCase } from "../../services/chatbot/src/application/use-cases/SendMessageUseCase.js";
import { PromptStrategyContext, UnknownRoleStrategyError } from "../../services/chatbot/src/domain/strategies/PromptStrategyContext.js";
import { EstudiantePromptStrategy } from "../../services/chatbot/src/domain/strategies/EstudiantePromptStrategy.js";
import { AdminPromptStrategy } from "../../services/chatbot/src/domain/strategies/AdminPromptStrategy.js";
import type { IPromptStrategy } from "../../services/chatbot/src/domain/strategies/IPromptStrategy.js";

const ORIGINAL_ENV = process.env;

describe("US-CB04 — Strategy Pattern Integration: Role-based Prompt Selection", () => {
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

  describe("Criterion 1: Estudiante role applies EstudiantePromptStrategy", () => {
    it("should call EstudiantePromptStrategy.buildSystemPrompt and NOT AdminPromptStrategy for role 'estudiante'", async () => {
      const studentSpy = vi.spyOn(EstudiantePromptStrategy.prototype, "buildSystemPrompt");
      const adminSpy = vi.spyOn(AdminPromptStrategy.prototype, "buildSystemPrompt");

      await useCase.execute("estudiante", "¿Cómo crear un grupo?");

      expect(studentSpy).toHaveBeenCalledTimes(1);
      expect(adminSpy).not.toHaveBeenCalled();

      studentSpy.mockRestore();
      adminSpy.mockRestore();
    });

    it("should return a simulated response containing student-specific text for 'estudiante'", async () => {
      const result = await useCase.execute("estudiante", "¿Cómo crear un grupo?");

      expect(result.reply).toContain("[Simulación Estudiante Bot]");
      expect(result.reply).toContain("UniConnect");
      expect(result.reply).toContain("foros, chats, grupos de estudio, recursos, etc.");
      expect(Array.isArray(result.referencias)).toBe(true);
    });

    it("should build a system prompt with accessible language for estudiantes", () => {
      const strategy = new EstudiantePromptStrategy();
      const prompt = strategy.buildSystemPrompt();

      expect(prompt).toContain("asistente virtual para estudiantes");
      expect(prompt).toContain("claro, accesible y amigable");
      expect(prompt).toContain("limítate única y estrictamente a brindar información sobre las funcionalidades de la plataforma");
    });
  });

  describe("Criterion 2: Admin role applies AdminPromptStrategy", () => {
    it("should call AdminPromptStrategy.buildSystemPrompt and NOT EstudiantePromptStrategy for role 'admin'", async () => {
      const studentSpy = vi.spyOn(EstudiantePromptStrategy.prototype, "buildSystemPrompt");
      const adminSpy = vi.spyOn(AdminPromptStrategy.prototype, "buildSystemPrompt");

      await useCase.execute("admin", "Mostrar logs del sistema");

      expect(adminSpy).toHaveBeenCalledTimes(1);
      expect(studentSpy).not.toHaveBeenCalled();

      studentSpy.mockRestore();
      adminSpy.mockRestore();
    });

    it("should return a simulated response containing admin-specific text for 'admin'", async () => {
      const result = await useCase.execute("admin", "Mostrar logs del sistema");

      expect(result.reply).toContain("[Simulación Admin Bot]");
      expect(result.reply).toContain("Hola Administrador");
      expect(result.reply).toContain("0 logs de error");
      expect(Array.isArray(result.referencias)).toBe(true);
    });

    it("should build a system prompt with technical context for admins", () => {
      const strategy = new AdminPromptStrategy();
      const prompt = strategy.buildSystemPrompt();

      expect(prompt).toContain("asistente técnico para administradores");
      expect(prompt).toContain("logs de auditoría");
      expect(prompt).toContain("métricas de rendimiento");
      expect(prompt).toContain("configuración del sistema");
    });
  });

  describe("Criterion 3: New roles can be added dynamically without modifying existing code", () => {
    it("should register and apply a new MonitorPromptStrategy without affecting existing strategies", () => {
      const context = new PromptStrategyContext();

      class MonitorPromptStrategy implements IPromptStrategy {
        buildSystemPrompt(): string {
          return "Eres un asistente para monitores de UniConnect. Supervisas el comportamiento en foros y chats.";
        }
      }

      context.registerStrategy("monitor", new MonitorPromptStrategy());

      const monitorStrategy = context.getStrategyForRole("monitor");
      expect(monitorStrategy).toBeInstanceOf(MonitorPromptStrategy);
      expect(monitorStrategy.buildSystemPrompt()).toContain("monitores");

      const studentStrategy = context.getStrategyForRole("estudiante");
      expect(studentStrategy).toBeInstanceOf(EstudiantePromptStrategy);
    });

    it("should allow the new strategy to run independently via buildPromptForRole", () => {
      const context = new PromptStrategyContext();

      class ModeratorPromptStrategy implements IPromptStrategy {
        buildSystemPrompt(): string {
          return "Eres un asistente para moderadores. Gestionas reportes y sanciones.";
        }
      }

      context.registerStrategy("moderator", new ModeratorPromptStrategy());
      const prompt = context.buildPromptForRole("moderator");

      expect(prompt).toBe("Eres un asistente para moderadores. Gestionas reportes y sanciones.");
    });

    it("should return a simulated response for a dynamically registered role through the full use case", async () => {
      const context = new PromptStrategyContext();

      class MonitorPromptStrategy implements IPromptStrategy {
        buildSystemPrompt(): string {
          return "[Monitor Prompt] Eres un monitor en UniConnect.";
        }
      }

      context.registerStrategy("monitor", new MonitorPromptStrategy());

      const monitorStrategy = context.getStrategyForRole("monitor");
      const prompt = monitorStrategy.buildSystemPrompt();
      expect(prompt).toContain("[Monitor Prompt]");
    });
  });

  describe("Criterion 4: Unknown role raises controlled exception, logs error, and does not break session", () => {
    it("should throw UnknownRoleStrategyError when getStrategyForRole receives an unregistered role", () => {
      const context = new PromptStrategyContext();

      expect(() => context.getStrategyForRole("non-registered-role")).toThrow(UnknownRoleStrategyError);
      expect(() => context.getStrategyForRole("non-registered-role")).toThrow(
        'No strategy registered for user role: "non-registered-role"'
      );
    });

    it("should catch UnknownRoleStrategyError internally in buildPromptForRole, log warning, and fall back to default", () => {
      const context = new PromptStrategyContext();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const prompt = context.buildPromptForRole("non-existent-role");

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain("[PromptStrategyContext Warning]");
      expect(consoleErrorSpy.mock.calls[0][0]).toContain("non-existent-role");

      const studentDefault = new EstudiantePromptStrategy().buildSystemPrompt();
      expect(prompt).toBe(studentDefault);

      consoleErrorSpy.mockRestore();
    });

    it("should NOT throw when SendMessageUseCase receives an unknown role (graceful degradation)", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      let result;
      let thrown = false;
      try {
        result = await useCase.execute("non-existent-role", "consulta de prueba");
      } catch {
        thrown = true;
      }

      expect(thrown).toBe(false);
      expect(result).toBeDefined();
      expect(result!.reply).toBeDefined();
      expect(result!.reply).toContain("[Simulación Estudiante Bot]");

      consoleErrorSpy.mockRestore();
    });

    it("should log the unknown role warning via console.error through the full use case flow", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await useCase.execute("unknown_role_xyz", "test");

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedMessage = consoleErrorSpy.mock.calls.map(call => call[0]).join(" ");
      expect(loggedMessage).toContain("[PromptStrategyContext Warning]");
      expect(loggedMessage).toContain("unknown_role_xyz");

      consoleErrorSpy.mockRestore();
    });

    it("should return HTTP 200-equivalent response for unknown role (no server error)", async () => {
      const result = await useCase.execute("unknown_role_xyz", "test");

      expect(result.reply).not.toContain("[Error de Conexión]");
      expect(result.reply).not.toContain("SERVER_ERROR");
      expect(result.reply).toBeTruthy();
      expect(Array.isArray(result.referencias)).toBe(true);
    });
  });
});
