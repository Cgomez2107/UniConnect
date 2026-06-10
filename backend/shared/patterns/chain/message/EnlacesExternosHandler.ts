import { MessageValidator, type ValidationMetadata } from "./MessageValidator.js";
import type { ResultadoValidacion } from "./ResultadoValidacion.js";

export class EnlacesExternosHandler extends MessageValidator {
  protected async validar(content: string, metadata?: ValidationMetadata): Promise<ResultadoValidacion> {
    // Por ahora aprueba por defecto y continúa la cadena
    return { valido: true };
  }
}
