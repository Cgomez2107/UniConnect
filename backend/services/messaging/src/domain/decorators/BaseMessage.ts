/**
 * BaseMessage.ts
 *
 * CA2: Implementación base de IMessage.
 * Responsabilidad:
 * - Guardar datos básicos del mensaje (content, userId, timestamp)
 * - Proporcionar punto de partida para decoradores
 * - Implementar getContent(), getMetadata(), render()
 */

import type { IMessage } from "./IMessage.js";

export class BaseMessage implements IMessage {
  readonly id: string;
  readonly content: string;
  readonly timestamp: Date;
  readonly senderId: string;

  constructor(input: {
    id: string;
    content: string;
    timestamp: Date;
    senderId: string;
  }) {
    this.id = input.id;
    this.content = input.content;
    this.timestamp = input.timestamp;
    this.senderId = input.senderId;
  }

  /**
   * CA2: Retorna el contenido de texto plano del mensaje
   */
  getContent(): string {
    return this.content;
  }

  /**
   * CA2: Retorna metadatos básicos del mensaje
   */
  getMetadata(): Record<string, unknown> {
    return {
      id: this.id,
      senderId: this.senderId,
      timestamp: this.timestamp.toISOString(),
      content: this.content,
    };
  }

  /**
   * CA2: Renderiza el mensaje (en BaseMessage, es igual al contenido)
   */
  render(): string {
    return this.content;
  }

  /**
   * Serializar a JSON
   */
  toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
