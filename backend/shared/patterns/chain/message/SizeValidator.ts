import { MessageValidator, type ValidationMetadata } from "./MessageValidator.js";
import type { ResultadoValidacion } from "./ResultadoValidacion.js";
import { SizeError } from "../../../libs/errors/SizeError.js";

export class SizeValidator extends MessageValidator {
  constructor(private readonly maxLength: number = 5000) {
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
        codigoError: "SizeError",
        mensajeError: `Mensaje demasiado largo. Máximo ${this.maxLength} caracteres.`,
      };
    }

    return { valido: true };
  }
}