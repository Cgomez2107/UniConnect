/**
 * MessageDecorator.ts
 *
 * CA6: Clase abstracta base para todos los decoradores.
 * Permite composición/anidación de decoradores (componibles).
 *
 * Patrón:
 * 1. Decorador recibe un IMessage (puede ser BaseMessage u otro Decorador)
 * 2. Delega operaciones al mensaje interno
 * 3. Agrega su propia funcionalidad
 *
 * Ejemplo de cadena composable:
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
 * - Garantizar composibilidad (CA6)
 */
export abstract class MessageDecorator implements IMessage {
  /**
   * El mensaje "envuelto" (puede ser BaseMessage u otro Decorador)
   * Permite anidación ilimitada
   */
  protected readonly message: IMessage;

  constructor(message: IMessage) {
    this.message = message;
  }

  /**
   * Propiedades delegadas al mensaje interno (solo lectura)
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
   * CA6: Delega getContent() al mensaje interno.
   * Los decoradores pueden sobrescribir para modificar contenido.
   */
  getContent(): string {
    return this.message.getContent();
  }

  /**
   * CA6: Delega getMetadata() y COMBINA con datos del decorador.
   * Los subclases deben llamar a super.getMetadata() y agregar sus datos.
   */
  getMetadata(): Record<string, unknown> {
    return this.message.getMetadata();
  }

  /**
   * CA6: Delega render() al mensaje interno.
   * Los decoradores pueden sobrescribir para cambiar presentación.
   */
  render(): string {
    return this.message.render();
  }

  /**
   * Serialización: combina datos base + datos del decorador.
   * Los subclases deben llamar a super.toJSON() para mantener estructura.
   */
  toJSON(): Record<string, unknown> {
    return this.message.toJSON();
  }
}
