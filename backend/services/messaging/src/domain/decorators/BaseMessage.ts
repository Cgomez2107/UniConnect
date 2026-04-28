/**
 * BaseMessage.ts
 *
 * Implementación base de IMessage.
 *
 * Responsabilidad:
 * - Guardar datos básicos del mensaje
 * - Proporcionar punto de partida para decoradores
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

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      content: this.content,
      timestamp: this.timestamp.toISOString(),
      senderId: this.senderId,
    };
  }
}
