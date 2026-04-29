/**
 * ReactionDecorator.ts
 *
 * Decorador que agrega reacciones (emojis) al mensaje.
 *
 * Flujo:
 * 1. Mensaje base: "¡Excelente!"
 * 2. Decorador: Agrega { "👍": 3, "❤️": 1 }
 * 3. Resultado: Mensaje con reacciones agregadas
 */

import type { IMessage } from "./IMessage.js";
import { MessageDecorator } from "./MessageDecorator.js";

/**
 * Metadata de una reacción
 */
export interface Reaction {
  readonly emoji: string; // "👍", "❤️", etc
  readonly count: number; // Cuántos usuarios reaccionaron
  readonly users: readonly string[]; // IDs de usuarios que reaccionaron
}

/**
 * Decorador: Agrega reacciones al mensaje
 *
 * Garantías:
 * - Valida que emoji sea válido (1 carácter Unicode)
 * - Valida que count = users.length
 * - Propaga todas las propiedades del mensaje base
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
   * Serializar: mensaje base + reacciones
   */
  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      reactions: this.getReactions().map((r) => ({
        emoji: r.emoji,
        count: r.count,
        users: r.users,
      })),
    };
  }
}
