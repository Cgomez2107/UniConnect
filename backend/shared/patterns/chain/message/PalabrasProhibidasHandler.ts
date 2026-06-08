import { MessageValidator, type ValidationMetadata } from "./MessageValidator.js";
import type { ResultadoValidacion } from "./ResultadoValidacion.js";

export class PalabrasProhibidasHandler extends MessageValidator {
  private readonly forbiddenPatterns: { word: string; pattern: RegExp }[];

  constructor(forbiddenWords: string[] = ["spam", "violencia", "odio", "racismo", "discriminación", "pornografía", "drogas", "armas", "idiota", "estupido", "insulto", "tonto", "perra", "marica", "hp", "hpta", "puto", "puta"]) {
    super();
    this.forbiddenPatterns = forbiddenWords.map((word) => ({
      word,
      pattern: new RegExp(word, "i"),
    }));
  }

  protected async validar(content: string, metadata?: ValidationMetadata): Promise<ResultadoValidacion> {
    const trimmed = content.trim();
    if (!trimmed) {
      return { valido: true };
    }

    for (const item of this.forbiddenPatterns) {
      if (item.pattern.test(trimmed)) {
        // Registrar el término detectado
        console.warn(`[Moderación] Término prohibido detectado: ${item.word}`);

        // No revelar al usuario qué término específico activó el filtro
        return {
          valido: false,
          codigoError: "MO_002",
          mensajeError: "Mensaje rechazado por contener palabras no permitidas.",
        };
      }
    }

    return { valido: true };
  }
}
