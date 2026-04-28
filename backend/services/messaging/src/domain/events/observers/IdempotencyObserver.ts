/**
 * IdempotencyObserver.ts
 *
 * Protección contra doble emisión de mensajes.
 *
 * Problema:
 * - Si hay un retry de red, el mismo mensaje puede enviarse 2 veces
 * - Usuario ve duplicado en el chat ❌
 *
 * Solución:
 * - Mantener registro de IDs procesados
 * - Si vuelve a llegar, ignorar
 *
 * Patrón: Idempotencia
 */

import type { IChatObserver } from "../ChatSubject.js";
import type { ChatEvent, ChatChannel } from "../ChatEvents.js";

/**
 * Interface para persistir IDs procesados
 */
export interface IIdempotencyStore {
  /**
   * Marcar un mensaje como procesado
   * @returns true si era nuevo, false si ya existía
   */
  markProcessed(messageId: string): Promise<boolean>;

  /**
   * Limpiar IDs antiguos (para no acumular para siempre)
   * @param olderThanSeconds - Limpiar registros más viejos que esto
   */
  cleanup(olderThanSeconds: number): Promise<void>;
}

/**
 * Observer que previene doble emisión
 *
 * Flujo:
 * 1. NewMessageEvent llega
 * 2. IdempotencyObserver.handle() verifica si messageId ya fue procesado
 * 3. Si ya existe: loguear y retornar (no duplicar)
 * 4. Si es nuevo: marcar como procesado y permitir
 *
 * ✅ Garantiza: El mismo messageId nunca se emite dos veces
 */
export class IdempotencyObserver implements IChatObserver {
  readonly name = "IdempotencyObserver";

  constructor(private readonly idempotencyStore: IIdempotencyStore) {}

  async handle(event: ChatEvent, channel: ChatChannel): Promise<void> {
    // Solo proteger NewMessage (otros eventos no tienen messageId)
    if (event.type !== "NewMessage") {
      return; // Otros tipos no necesitan idempotencia
    }

    const messageId = event.messageId;

    // Verificar si ya fue procesado
    const isNew = await this.idempotencyStore.markProcessed(messageId);

    if (!isNew) {
      console.warn(
        `[${this.name}] Mensaje "${messageId}" duplicado, ignorando en canal "${channel}"`,
      );
      return; // NO procesar si ya existe
    }

    // Es nuevo, permitir que otros observers lo procesen
    console.log(
      `[${this.name}] Mensaje "${messageId}" es nuevo, permitiendo propagación`,
    );
  }
}
