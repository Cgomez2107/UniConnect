/**
 * StudyGroupSubject.ts
 *
 * Implementación del patrón Subject/Observable.
 *
 * Responsabilidades:
 * - Mantener lista de observers
 * - Permitir suscripción/desuscripción
 * - Emitir eventos a todos los observers
 * - Manejar fallos sin romper el flujo
 */

import type { StudyGroupEvent } from "../StudyGroupEvents.js";
import type { IObserver } from "./IObserver.js";
import type { ISubject } from "./ISubject.js";

export class StudyGroupSubject implements ISubject {
  /**
   * Lista privada de observers registrados
   * Usamos Set para O(1) lookup en unsubscribe
   */
  private readonly observers: Set<IObserver> = new Set();

  /**
   * Nombre del subject (para logging)
   */
  private readonly name: string;

  constructor(name: string = "StudyGroupSubject") {
    this.name = name;
  }

  /**
   * Registra un nuevo observer
   *
   * Garantías:
   * - Si el mismo observer se registra 2 veces, solo se cuenta 1 (Set)
   * - El observer recibirá eventos desde este punto en adelante
   *
   * @param observer - Observer que implementa IObserver
   */
  subscribe(observer: IObserver): void {
    if (this.observers.has(observer)) {
      console.warn(
        `[${this.name}] Observer "${observer.name}" ya está registrado`,
      );
      return;
    }

    this.observers.add(observer);
    console.log(
      `[${this.name}] Observer "${observer.name}" registrado. Total: ${this.observers.size}`,
    );
  }

  /**
   * Desregistra un observer
   *
   * Garantías:
   * - El observer no recibirá más eventos
   * - Si no existe, no hace nada (safe)
   *
   * @param observer - Observer a remover
   */
  unsubscribe(observer: IObserver): void {
    const removed = this.observers.delete(observer);

    if (!removed) {
      console.warn(
        `[${this.name}] Observer "${observer.name}" no estaba registrado`,
      );
      return;
    }

    console.log(
      `[${this.name}] Observer "${observer.name}" desregistrado. Total: ${this.observers.size}`,
    );
  }

  /**
   * Emite un evento a TODOS los observers registrados
   *
   * Garantías de resiliencia:
   * - Si un observer falla, los otros siguen recibiendo eventos
   * - Los errores se loguean pero no se propagan (Fail-safe)
   *
   * @param event - Evento a emitir
   */
  async emit(event: StudyGroupEvent): Promise<void> {
    console.log(
      `[${this.name}] Emitiendo evento "${event.type}" a ${this.observers.size} observers`,
    );

    // Crear promesas para todos los observers
    const promises = Array.from(this.observers).map(async (observer) => {
      try {
        await observer.handle(event);
        console.log(
          `[${this.name}] Observer "${observer.name}" procesó evento "${event.type}"`,
        );
      } catch (error) {
        // ✅ RESILIENCIA: No romper flujo si un observer falla
        console.error(
          `[${this.name}] Error en observer "${observer.name}":`,
          error instanceof Error ? error.message : String(error),
        );
        // El evento sigue propagándose a otros observers
      }
    });

    // Esperar a que todos terminen (éxito o error)
    await Promise.all(promises);
    console.log(`[${this.name}] Evento "${event.type}" procesado por todos`);
  }

  /**
   * Retorna número de observers registrados
   * Útil para testing y debug
   */
  getObserverCount(): number {
    return this.observers.size;
  }

  /**
   * Limpia todos los observers
   * Útil para teardown en tests
   */
  clear(): void {
    console.log(`[${this.name}] Limpiando ${this.observers.size} observers`);
    this.observers.clear();
  }
}
