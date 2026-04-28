/**
 * MentionDecorator.ts
 *
 * Decorador que agrega menciones de usuarios al mensaje.
 *
 * Flujo:
 * 1. Mensaje base: "Hola @Carlos @Sofia"
 * 2. Decorador: Identifica menciones, valida que usuarios existan
 * 3. Resultado: Mensaje con menciones tipadas y validas
 */

import type { IMessage } from "./IMessage.js";
import { MessageDecorator } from "./MessageDecorator.js";

/**
 * Metadata de una mención
 */
export interface Mention {
  readonly userId: string;
  readonly displayName: string;
  readonly position: number; // Posición en el texto donde se menciona
}

/**
 * Decorador: Agrega menciones al mensaje
 *
 * Garantías:
 * - Valida que no haya menciones duplicadas
 * - Valida que userId no sea vacío
 * - Propaga todas las propiedades del mensaje base
 */
export class MentionDecorator extends MessageDecorator {
  private readonly mentions: readonly Mention[];

  constructor(message: IMessage, mentions: Mention[]) {
    super(message);

    // Validar no hay duplicados
    const userIds = new Set<string>();
    for (const mention of mentions) {
      if (userIds.has(mention.userId)) {
        throw new Error(
          `Mención duplicada para usuario "${mention.userId}"`,
        );
      }
      userIds.add(mention.userId);

      // Validar campos
      if (!mention.userId || mention.userId.trim().length === 0) {
        throw new Error("userId no puede estar vacío");
      }

      if (
        !mention.displayName ||
        mention.displayName.trim().length === 0
      ) {
        throw new Error("displayName no puede estar vacío");
      }

      if (mention.position < 0) {
        throw new Error("position debe ser >= 0");
      }
    }

    this.mentions = Object.freeze(mentions); // Inmutable
  }

  /**
   * Acceso a las menciones
   */
  getMentions(): readonly Mention[] {
    return this.mentions;
  }

  /**
   * Verificar si un usuario fue mencionado
   */
  isMentioned(userId: string): boolean {
    return this.mentions.some((m) => m.userId === userId);
  }

  /**
   * Serializar: mensaje base + menciones
   */
  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      mentions: this.mentions.map((m) => ({
        userId: m.userId,
        displayName: m.displayName,
        position: m.position,
      })),
    };
  }
}
