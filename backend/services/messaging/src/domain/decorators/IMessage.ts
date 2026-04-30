/**
 * IMessage.ts
 *
 * Interfaz base que todos los mensajes (base y decorados) deben cumplir.
 *
 * Garantía de contrato:
 * - Todo mensaje tiene id, content, timestamp
 * - Todo mensaje puede ser serializado a JSON
 * - Todo mensaje puede ser comparado
 */

export interface IMessage {
  /**
   * ID único del mensaje
   */
  readonly id: string;

  /**
   * Contenido de texto base
   */
  readonly content: string;

  /**
   * Cuándo se creó
   */
  readonly timestamp: Date;

  /**
   * Quién lo envió
   */
  readonly senderId: string;

  /**
   * Serializar a JSON para enviar al cliente
   */
  toJSON(): Record<string, unknown>;
}
