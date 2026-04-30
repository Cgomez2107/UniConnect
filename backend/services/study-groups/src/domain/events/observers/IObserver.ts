/**
 * IObserver.ts
 *
 * Interface que TODOS los observers deben cumplir.
 * Define el contrato: "Si quieres escuchar eventos, debes implementar este método"
 */

import type { StudyGroupEvent } from "../StudyGroupEvents.js";

/**
 * Observer Pattern - Interface
 *
 * Cualquier clase que quiera escuchar eventos debe:
 * 1. Implementar esta interface
 * 2. Ser registrada en un Subject
 */
export interface IObserver {
  /**
   * Se ejecuta cuando el Subject emite un evento
   *
   * @param event - El evento emitido
   * @throws Si el procesamiento falla, el Subject debería loguear pero continuar
   */
  handle(event: StudyGroupEvent): Promise<void>;

  /**
   * Nombre único del observer (para debug/logging)
   */
  readonly name: string; 
}
