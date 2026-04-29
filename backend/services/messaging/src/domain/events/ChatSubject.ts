/**
 * ChatSubject.ts
 *
 * Subject especializado para eventos de chat con soporte de CANALES.
 *
 * A diferencia de StudyGroupSubject que emite a TODOS los observers,
 * ChatSubject emite a observers ESPECÍFICOS del canal.
 *
 * Flujo:
 * 1. Observer se registra en canal específico
 * 2. Cuando evento ocurre en ese canal, solo ese observer se ejecuta
 * 3. Otros canales no son notificados
 */

import type { ChatEvent, ChatChannel } from "./ChatEvents.js";
import type { ISubject } from "./ISubject.js";

/**
 * Observer específico para chat
 * Necesita saber en qué canal está escuchando
 */
export interface IChatObserver {
  /**
   * Nombre único del observer
   */
  readonly name: string;

  /**
   * Se ejecuta cuando hay evento en el canal
   * @param event - El evento emitido
   * @param channel - El canal en que ocurrió (para contexto)
   */
  handle(event: ChatEvent, channel: ChatChannel): Promise<void>;
}

/**
 * ChatSubject con soporte de CANALES
 *
 * Cada canal mantiene su propia lista de observers.
 * Un evento en "grupo:123" NO se emite a observers de "dm:abc:def"
 */
export class ChatSubject implements ISubject {
  /**
   * Map: canal → lista de observers
   * Ejemplo:
   * {
   *   "grupo:grupo-123": [observer1, observer2],
   *   "dm:user-1:user-2": [observer3]
   * }
   */
  private readonly channels: Map<ChatChannel, Set<IChatObserver>> = new Map();

  private readonly name: string;

  constructor(name: string = "ChatSubject") {
    this.name = name;
  }

  /**
   * Registra un observer en un canal específico
   *
   * @param channel - Canal donde escuchar (grupo:123 o dm:u1:u2)
   * @param observer - Observer que implementa IChatObserver
   */
  subscribe(channel: ChatChannel, observer: IChatObserver): void {
    // Crear Set del canal si no existe
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }

    const observers = this.channels.get(channel)!;

    if (observers.has(observer)) {
      console.warn(
        `[${this.name}] Observer "${observer.name}" ya está en canal "${channel}"`,
      );
      return;
    }

    observers.add(observer);
    console.log(
      `[${this.name}] Observer "${observer.name}" registrado en canal "${channel}". Total: ${observers.size}`,
    );
  }

  /**
   * Desregistra un observer de un canal
   *
   * @param channel - Canal del que remover
   * @param observer - Observer a remover
   */
  unsubscribe(channel: ChatChannel, observer: IChatObserver): void {
    const observers = this.channels.get(channel);

    if (!observers) {
      console.warn(`[${this.name}] Canal "${channel}" no existe`);
      return;
    }

    const removed = observers.delete(observer);

    if (!removed) {
      console.warn(
        `[${this.name}] Observer "${observer.name}" no estaba en canal "${channel}"`,
      );
      return;
    }

    // Limpiar canal vacío
    if (observers.size === 0) {
      this.channels.delete(channel);
    }

    console.log(
      `[${this.name}] Observer "${observer.name}" desregistrado de canal "${channel}"`,
    );
  }

  /**
   * Emite evento SOLO en un canal específico
   *
   * ✅ Ventaja: Otros canales no se afectan
   * ✅ Eficiencia: Solo observers del canal se ejecutan
   *
   * @param channel - Canal donde emitir
   * @param event - Evento a emitir
   */
  async emit(channel: ChatChannel, event: ChatEvent): Promise<void> {
    const observers = this.channels.get(channel);

    if (!observers) {
      console.log(
        `[${this.name}] Evento "${event.type}" en canal "${channel}" pero sin observers (ok)`,
      );
      return;
    }

    console.log(
      `[${this.name}] Emitiendo evento "${event.type}" en canal "${channel}" a ${observers.size} observers`,
    );

    // Ejecutar todos los observers del canal
    const promises = Array.from(observers).map(async (observer) => {
      try {
        await observer.handle(event, channel);
        console.log(
          `[${this.name}] Observer "${observer.name}" procesó evento "${event.type}"`,
        );
      } catch (error) {
        // ✅ RESILIENCIA: No romper flujo si un observer falla
        console.error(
          `[${this.name}] Error en observer "${observer.name}":`,
          error instanceof Error ? error.message : String(error),
        );
      }
    });

    await Promise.all(promises);
    console.log(`[${this.name}] Evento "${event.type}" en canal "${channel}" procesado`);
  }

  /**
   * Retorna número de observers en un canal
   */
  getObserverCount(channel: ChatChannel): number {
    return this.channels.get(channel)?.size ?? 0;
  }

  /**
   * Limpia todos los canales
   */
  clear(): void {
    console.log(`[${this.name}] Limpiando ${this.channels.size} canales`);
    this.channels.clear();
  }
}
