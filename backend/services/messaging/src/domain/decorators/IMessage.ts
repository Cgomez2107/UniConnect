/**
 * IMessage.ts
 *
 * Interfaz base que todos los mensajes (base y decorados) deben cumplir.
 *
 * Garantía de contrato (CA1):
 * - Todo mensaje debe implementar getContent(), getMetadata() y render()
 * - Todo mensaje puede ser serializado a JSON
 * - Cumplimiento total del patrón Decorator
 */

/**
 * CA1: Interfaz base para todos los mensajes (base y decorados).
 * Garantiza contrato uniforme para getContent(), getMetadata(), render()
 */
export interface IMessage {
  /**
   * Identificador único del mensaje
   */
  readonly id: string;

  /**
   * Contenido de texto del mensaje
   */
  readonly content: string;

  /**
   * Timestamp del mensaje (cuándo fue creado)
   */
  readonly timestamp: Date;

  /**
   * ID del usuario que envió el mensaje
   */
  readonly senderId: string;

  /**
   * Obtener el contenido de texto del mensaje.
   * - BaseMessage: retorna el texto plano
   * - MentionDecorator: retorna contenido con menciones resaltadas (**@displayName**)
   * - Otros decoradores: delegan al mensaje interno
   */
  getContent(): string;

  /**
   * Obtener los metadatos del mensaje completo.
   * Incluye datos base (id, userId, timestamp) + datos de decoradores.
   * - FileDecorator añade: { file: FileMetadata }
   * - MentionDecorator añade: { mentions: Mention[] }
   * - ReactionDecorator añade: { reactions: Reaction[] }
   */
  getMetadata(): Record<string, unknown>;

  /**
   * Renderizar el mensaje con formato visual específico.
   * - BaseMessage: retorna el contenido plano
   * - MentionDecorator: resalta menciones con **@displayName**
   * - Otros decoradores: agrega su información al resultado
   */
  render(): string;

  /**
   * Serializar a JSON para transmitir al cliente.
   * Debe incluir todos los datos: getMetadata() + getContent()
   */
  toJSON(): Record<string, unknown>;
}
