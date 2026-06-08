import { BaseValidator } from "./BaseValidator";
import type { ValidationMetadata } from "./IValidationHandler";

const DEFAULT_FORBIDDEN_WORDS = [
  "spam", "violencia", "odio", "racismo",
  "discriminación", "pornografía", "drogas", "armas",
  "idiota", "estupido", "insulto", "tonto",
  "perra", "marica", "hp", "hpta", "puto", "puta",
];

export class ContentValidator extends BaseValidator {
  private readonly wordPatterns: RegExp[];

  constructor(forbiddenWords: string[] = DEFAULT_FORBIDDEN_WORDS) {
    super();
    this.wordPatterns = forbiddenWords.map(
      (word) => new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
    );
  }

  async validate(content: string, _metadata?: ValidationMetadata): Promise<void> {
    const trimmed = content.trim();
    if (!trimmed) return;

    for (const pattern of this.wordPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(trimmed)) {
        const error = new Error("El mensaje contiene contenido no permitido.");
        error.name = "BANNED_CONTENT";
        throw error;
      }
    }
  }
}
