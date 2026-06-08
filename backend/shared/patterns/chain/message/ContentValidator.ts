import { MessageValidator } from "./MessageValidator.js";
import type { ResultadoValidacion } from "./ResultadoValidacion.js";

export class ContentValidator extends MessageValidator {
  private readonly forbiddenPatterns: RegExp[];

  constructor(forbiddenWords: string[] = ["spam", "violencia", "odio", "racismo", "discriminación", "pornografía", "drogas", "armas", "idiota", "estupido", "insulto", "tonto", "perra", "marica", "hp", "hpta", "puto", "puta"]) {
    super();
    this.forbiddenPatterns = forbiddenWords.map(word => new RegExp(word, "i"));
  }

  protected async validar(content: string, metadata?: Record<string, unknown>): Promise<ResultadoValidacion> {
    const trimmed = content.trim();
    if (!trimmed) {
      return { valido: true };
    }

    for (const pattern of this.forbiddenPatterns) {
      if (pattern.test(trimmed)) {
        return {
          valido: false,
          codigoError: "ContentError",
          mensajeError: "Mensaje rechazado: contiene palabras no permitidas.",
        };
      }
    }

    return { valido: true };
  }
}