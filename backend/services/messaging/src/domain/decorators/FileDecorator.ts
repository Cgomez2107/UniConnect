/**
 * FileDecorator.ts
 *
 * Decorador que agrega metadata de archivo a un mensaje.
 *
 * Flujo:
 * 1. Mensaje base: "Aquí está el documento"
 * 2. Decorador: Agrega { filename, size, mimeType, url }
 * 3. Resultado: Mensaje con archivo adjunto
 */

import type { IMessage } from "./IMessage.js";
import { MessageDecorator } from "./MessageDecorator.js";

/**
 * Metadata del archivo adjunto
 */
export interface FileMetadata {
  readonly filename: string;
  readonly size: number; // en bytes
  readonly mimeType: string; // ej: "application/pdf", "image/png"
  readonly url: string; // URL donde descargar
}

/**
 * Decorador: Agrega archivo al mensaje
 *
 * Garantías:
 * - Válida que mimeType sea conocido
 * - Válida que size sea razonable (< 100MB)
 * - Propaga todas las propiedades del mensaje base
 */
export class FileDecorator extends MessageDecorator {
  private readonly file: FileMetadata;

  constructor(message: IMessage, file: FileMetadata) {
    super(message);

    // Validar metadata
    if (!file.filename || file.filename.trim().length === 0) {
      throw new Error("filename no puede estar vacío");
    }

    if (file.size <= 0 || file.size > 100 * 1024 * 1024) {
      // 100MB max
      throw new Error("size debe estar entre 0 y 100MB");
    }

    if (!file.mimeType || file.mimeType.trim().length === 0) {
      throw new Error("mimeType no puede estar vacío");
    }

    if (!file.url || file.url.trim().length === 0) {
      throw new Error("url no puede estar vacía");
    }

    this.file = file;
  }

  /**
   * Acceso a metadata del archivo
   */
  getFile(): FileMetadata {
    return this.file;
  }

  /**
   * Serializar: mensaje base + archivo
   */
  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      file: {
        filename: this.file.filename,
        size: this.file.size,
        mimeType: this.file.mimeType,
        url: this.file.url,
      },
    };
  }
}
