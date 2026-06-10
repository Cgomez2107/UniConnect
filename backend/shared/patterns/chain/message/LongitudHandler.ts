import { MessageValidator, type ValidationMetadata } from "./MessageValidator.js";
import type { ResultadoValidacion } from "./ResultadoValidacion.js";

export class LongitudHandler extends MessageValidator {
  constructor(private readonly maxLength: number = 1000) {
    super();
  }

  protected async validar(content: string, metadata?: ValidationMetadata): Promise<ResultadoValidacion> {
    const trimmed = content.trim();

    if (!trimmed && !metadata?.mediaUrl) {
      return { valido: false, codigoError: "SizeError", mensajeError: "Debes enviar texto o una imagen." };
    }

    if (trimmed.length > this.maxLength) {
      return {
        valido: false,
        codigoError: "MO_001",
        mensajeError: "Mensaje demasiado largo",
      };
    }

    return { valido: true };
  }
}
