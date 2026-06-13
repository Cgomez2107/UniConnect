import { describe, it, expect, vi } from "vitest";
import { EstudiantePromptStrategy } from "../src/domain/strategies/EstudiantePromptStrategy.js";
import { AdminPromptStrategy } from "../src/domain/strategies/AdminPromptStrategy.js";
import { PromptStrategyContext } from "../src/domain/strategies/PromptStrategyContext.js";
import type { IPromptStrategy } from "../src/domain/strategies/IPromptStrategy.js";

describe("Chatbot Strategy Pattern Tests", () => {
  it("should generate clear and accessible prompt for 'estudiante' strategy", () => {
    const strategy = new EstudiantePromptStrategy();
    const prompt = strategy.buildSystemPrompt();
    expect(prompt).toContain("asistente virtual para estudiantes");
    expect(prompt).toContain("claro, accesible y amigable");
    expect(prompt).toContain("limítate única y estrictamente a brindar información sobre las funcionalidades de la plataforma");
  });

  it("should generate technical and metrics-related prompt for 'admin' strategy", () => {
    const strategy = new AdminPromptStrategy();
    const prompt = strategy.buildSystemPrompt();
    expect(prompt).toContain("asistente técnico para administradores");
    expect(prompt).toContain("logs de auditoría");
    expect(prompt).toContain("métricas de rendimiento");
  });

  it("should retrieve correctly registered strategies from context", () => {
    const context = new PromptStrategyContext();
    const studentStrategy = context.getStrategyForRole("estudiante");
    const adminStrategy = context.getStrategyForRole("admin");

    expect(studentStrategy).toBeInstanceOf(EstudiantePromptStrategy);
    expect(adminStrategy).toBeInstanceOf(AdminPromptStrategy);
  });

  it("should support dynamic registration of new roles without changing existing code (Criterion 3)", () => {
    const context = new PromptStrategyContext();

    class MonitorPromptStrategy implements IPromptStrategy {
      buildSystemPrompt(): string {
        return "Eres un bot para monitores.";
      }
    }

    // Register a new strategy dynamically
    context.registerStrategy("monitor", new MonitorPromptStrategy());

    const monitorStrategy = context.getStrategyForRole("monitor");
    expect(monitorStrategy).toBeInstanceOf(MonitorPromptStrategy);
    expect(monitorStrategy.buildSystemPrompt()).toBe("Eres un bot para monitores.");
  });

  it("should internally catch and log unknown role exceptions without interrupting the flow (Criterion 4)", () => {
    const context = new PromptStrategyContext();

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Evaluating a non-registered role: should NOT throw, should log warning, and should fallback to default (student) strategy
    const prompt = context.buildPromptForRole("non-registered-role");

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls[0][0]).toContain("[PromptStrategyContext Warning]");
    
    // Check fallback behavior
    const studentDefaultPrompt = new EstudiantePromptStrategy().buildSystemPrompt();
    expect(prompt).toBe(studentDefaultPrompt);

    consoleErrorSpy.mockRestore();
  });
});
