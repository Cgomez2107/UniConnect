export interface IPromptStrategy {
  buildSystemPrompt(context?: any): string;
}
