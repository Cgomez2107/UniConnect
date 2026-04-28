/**
 * MessageDecorator.ts
 *
 * Clase abstracta base para todos los decoradores.
 *
 * Patrón:
 * 1. Decorador recibe un IMessage (puede ser BaseMessage u otro Decorador)
 * 2. Delega operaciones al mensaje interno
 * 3. Agrega su propia funcionalidad
 *
 * Ejemplo de cadena:
 *   BaseMessage
 *     ↓ (wraps)
 *   FileDecorator
 *     ↓ (wraps)
 *   MentionDecorator
 *     ↓ (wraps)
 *   ReactionDecorator
 */

import type { IMessage } from "./IMessage.js";

/**
 * Clase abstracta que todos los decoradores extienden.
 *
 * Responsabilidad:
 * - Implementar IMessage
 * - Delegar al mensaje interno (encapsulación)
 * - Permitir que subclases agreguen funcionalidad
 */
export abstract class MessageDecorator implements IMessage {
  /**
   * El mensaje "envuelto" (puede ser BaseMessage u otro Decorador)
   */
  protected readonly message: IMessage;

  constructor(message: IMessage) {
    this.message = message;
  }

  /**
   * Propiedades delegadas al mensaje interno
   */
  get id(): string {
    return this.message.id;
  }

  get content(): string {
    return this.message.content;
  }

  get timestamp(): Date {
    return this.message.timestamp;
  }

  get senderId(): string {
    return this.message.senderId;
  }

  /**
   * Serialización: combina datos base + datos del decorador
   * Los subclases deben llamar a super.toJSON() para mantener estructura
   */
  toJSON(): Record<string, unknown> {
    return this.message.toJSON();
  }
}
