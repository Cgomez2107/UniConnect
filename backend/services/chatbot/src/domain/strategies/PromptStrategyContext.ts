import { IPromptStrategy } from "./IPromptStrategy.js";
import { EstudiantePromptStrategy } from "./EstudiantePromptStrategy.js";
import { AdminPromptStrategy } from "./AdminPromptStrategy.js";

export class UnknownRoleStrategyError extends Error {
  constructor(public role: string) {
    super(`No strategy registered for user role: "${role}"`);
    this.name = "UnknownRoleStrategyError";
  }
}

export class PromptStrategyContext {
  private strategies = new Map<string, IPromptStrategy>();
  private defaultStrategy: IPromptStrategy;

  constructor() {
    // Register base strategies
    this.strategies.set("estudiante", new EstudiantePromptStrategy());
    this.strategies.set("admin", new AdminPromptStrategy());
    // Default to student strategy
    this.defaultStrategy = new EstudiantePromptStrategy();
  }

  registerStrategy(role: string, strategy: IPromptStrategy): void {
    this.strategies.set(role, strategy);
  }

  getStrategyForRole(role: string): IPromptStrategy {
    const strategy = this.strategies.get(role);
    if (!strategy) {
      throw new UnknownRoleStrategyError(role);
    }
    return strategy;
  }

  // Evaluator helper that catches internally and logs the exception without interrupting the flow (Criterio 4)
  buildPromptForRole(role: string, context?: any): string {
    try {
      const strategy = this.getStrategyForRole(role);
      return strategy.buildSystemPrompt(context);
    } catch (error) {
      if (error instanceof UnknownRoleStrategyError) {
        // Log internally as warning without crashing
        console.error(`[PromptStrategyContext Warning] ${error.message}. Falling back to default student strategy.`);
        return this.defaultStrategy.buildSystemPrompt(context);
      }
      throw error;
    }
  }
}
