import type { ApplicationError } from "../../../libs/errors/ApplicationError.js";
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

  setNext(validator: MessageValidator): MessageValidator {
    this.next = validator;
    return validator;
  }

  setSiguiente(handler: MessageValidator): MessageValidator {
    return this.setNext(handler);
  }

  abstract validate(content: string, metadata?: ValidationMetadata): Promise<void>;

  async manejar(mensaje: string, metadata?: ValidationMetadata): Promise<ResultadoValidacion> {
    try {
      await this.validate(mensaje, metadata);
      return { valido: true };
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        const appError = error as ApplicationError;
        return {
          valido: false,
          codigoError: appError.name,
          mensajeError: appError.message,
        };
      }
      throw error;
    }
  }

  protected async executeNext(content: string, metadata?: ValidationMetadata): Promise<void> {
    if (this.next) {
      await this.next.validate(content, metadata);
    }
  }
}
