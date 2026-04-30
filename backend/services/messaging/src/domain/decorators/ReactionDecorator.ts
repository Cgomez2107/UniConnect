/**
 * ReactionDecorator.ts
 *
 * CA5: Decorador que agrega reacciones (emojis) al mensaje.
 * CA6: Es componible (puede envolver BaseMessage u otro decorador)
 *
 * Flujo:
 * 1. Mensaje base: "¡Excelente!"
 * 2. ReactionDecorator envuelve el mensaje
 * 3. Agrega mapa de reacciones: { "👍": 3, "❤️": 1 }
 * 4. Resultado: Mensaje con reacciones agregadas
 */

import type { IMessage } from "./IMessage.js";
import { MessageDecorator } from "./MessageDecorator.js";

/**
 * CA5: Metadata de una reacción
 */
export interface Reaction {
  readonly emoji: string; // "👍", "❤️", etc
  readonly count: number; // Cuántos usuarios reaccionaron
  readonly users: readonly string[]; // IDs de usuarios que reaccionaron
}

/**
 * CA5, CA6: Decorador que agrega reacciones al mensaje
 *
 * Garantías:
 * - Valida que emoji sea válido (1 carácter Unicode)
 * - Valida que count = users.length
 * - Propaga todas las propiedades del mensaje base
 * - Componible: puede ser envuelto por otro decorador
 */
export class ReactionDecorator extends MessageDecorator {
  private readonly reactions: Map<string, Reaction>;

  constructor(message: IMessage, reactions: Reaction[] = []) {
    super(message);

    this.reactions = new Map();

    // Validar y agregar reacciones
    for (const reaction of reactions) {
      // Validar emoji
      if (!reaction.emoji || reaction.emoji.trim().length === 0) {
        throw new Error("emoji no puede estar vacío");
      }

      // Validar consistency: count debe coincidir con users.length
      if (reaction.count !== reaction.users.length) {
        throw new Error(
          `Inconsistencia en reacción "${reaction.emoji}": count (${reaction.count}) !== users.length (${reaction.users.length})`,
        );
      }

      // Validar no hay duplicados en users
      const uniqueUsers = new Set(reaction.users);
      if (uniqueUsers.size !== reaction.users.length) {
        throw new Error(
          `Usuarios duplicados en reacción "${reaction.emoji}"`,
        );
      }

      this.reactions.set(reaction.emoji, {
        emoji: reaction.emoji,
        count: reaction.count,
        users: Object.freeze([...reaction.users]), // Copia inmutable
      });
    }
  }

  /**
   * Obtener todas las reacciones
   */
  getReactions(): Reaction[] {
    return Array.from(this.reactions.values());
  }

  /**
   * Obtener reacción específica
   */
  getReaction(emoji: string): Reaction | undefined {
    return this.reactions.get(emoji);
  }

  /**
   * Agregar reacción (o incrementar si ya existe)
   *
   * @param emoji - El emoji a reaccionar
   * @param userId - Quién reacciona
   * @returns Nueva reacción actualizada
   */
  addReaction(emoji: string, userId: string): Reaction {
    const existing = this.reactions.get(emoji);

    if (existing) {
      // Evitar duplicados
      if (existing.users.includes(userId)) {
        return existing; // Ya reaccionó con este emoji
      }

      const updated: Reaction = {
        emoji,
        count: existing.count + 1,
        users: Object.freeze([...existing.users, userId]),
      };

      this.reactions.set(emoji, updated);
      return updated;
    }

    // Nueva reacción
    const newReaction: Reaction = {
      emoji,
      count: 1,
      users: Object.freeze([userId]),
    };

    this.reactions.set(emoji, newReaction);
    return newReaction;
  }

  /**
   * Remover reacción (o decrementar si otros usuarios la tienen)
   *
   * @param emoji - El emoji a desreaccionar
   * @param userId - Quién retira la reacción
   */
  removeReaction(emoji: string, userId: string): void {
    const existing = this.reactions.get(emoji);

    if (!existing) {
      return; // No existe esa reacción
    }

    const updated = existing.users.filter((id) => id !== userId);

    if (updated.length === 0) {
      // Si no quedan usuarios, eliminar reacción
      this.reactions.delete(emoji);
    } else {
      // Actualizar con menos usuarios
      this.reactions.set(emoji, {
        emoji,
        count: updated.length,
        users: Object.freeze(updated),
      });
    }
  }

  /**
   * CA5: Implementa getContent() - delega al mensaje interno
   */
  override getContent(): string {
    return this.message.getContent();
  }

  /**
   * CA5: Implementa getMetadata() - combina base + reacciones
   */
  override getMetadata(): Record<string, unknown> {
    return {
      ...this.message.getMetadata(),
      reactions: this.getReactions().map((r) => ({
        emoji: r.emoji,
        count: r.count,
        users: r.users,
      })),
    };
  }

  /**
   * CA5: Implementa render() - delega al mensaje interno
   */
  override render(): string {
    return this.message.render();
  }

  /**
   * Serializar: mensaje base + reacciones
   */
  override toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
