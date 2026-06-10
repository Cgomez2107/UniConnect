import type { ResultadoValidacion } from "./ResultadoValidacion.js";

export interface ValidationMetadata {
  mediaUrl?: string;
  mediaType?: string;
  mediaFilename?: string;
  senderId?: string;
  requestId?: string;
  isGroup?: boolean;
}

export abstract class MessageValidator {
  protected next: MessageValidator | null = null;

  setSiguiente(handler: MessageValidator): this {
    if (this.next === null) {
      this.next = handler;
    } else {
      this.next.setSiguiente(handler);
    }
    return this;
  }

  async manejar(mensaje: string, metadata?: ValidationMetadata): Promise<ResultadoValidacion> {
    const resultado = await this.validar(mensaje, metadata);
    if (!resultado.valido) {
      return resultado;
    }

    if (this.next) {
      const contenidoParaSiguiente = resultado.contenidoModificado ?? mensaje;
      return this.next.manejar(contenidoParaSiguiente, metadata);
    }

    return resultado;
  }

  protected abstract validar(mensaje: string, metadata?: ValidationMetadata): Promise<ResultadoValidacion>;
}