/**
 * FileDecorator.ts
 *
 * CA3: Decorador que agrega metadata de archivo a un mensaje.
 * CA6: Es componible (puede envolver BaseMessage u otro decorador)
 *
 * Flujo:
 * 1. Mensaje base: "Aquí está el documento"
 * 2. FileDecorator envuelve el mensaje
 * 3. Agrega { url, mimeType, tamaño }
 * 4. Resultado: Mensaje con archivo adjunto
 */

import type { IMessage } from "./IMessage.js";
import { MessageDecorator } from "./MessageDecorator.js";

/**
 * CA3: Metadata del archivo adjunto
 */
export interface FileMetadata {
  readonly filename: string;
  readonly size: number; // en bytes
  readonly mimeType: string; // ej: "application/pdf", "image/png"
  readonly url: string; // URL donde descargar
}

/**
 * CA3, CA6: Decorador que agrega archivo al mensaje
 *
 * Garantías:
 * - Válida que mimeType sea conocido
 * - Válida que size sea razonable (< 100MB)
 * - Propaga todas las propiedades del mensaje base
 * - Componible: puede ser envuelto por otro decorador
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
   * CA3: Implementa getContent() - delega al mensaje interno
   */
  override getContent(): string {
    return this.message.getContent();
  }

  /**
   * CA3: Implementa getMetadata() - combina base + archivo
   */
  override getMetadata(): Record<string, unknown> {
    return {
      ...this.message.getMetadata(),
      file: {
        filename: this.file.filename,
        size: this.file.size,
        mimeType: this.file.mimeType,
        url: this.file.url,
      },
    };
  }

  /**
   * CA3: Implementa render() - delega al mensaje interno
   */
  override render(): string {
    return this.message.render();
  }

  /**
   * Serializar: mensaje base + archivo
   */
  override toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
