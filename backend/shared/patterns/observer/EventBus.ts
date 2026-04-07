/**
 * Application Event Bus Singleton
 * 
 * Un único EventBus compartido por toda la aplicación
 * Mantiene registro de observadores y emite eventos globales
 * 
 * Uso en Use Cases:
 * 
 * ```typescript
 * import { EventBus } from '@uniconnect/shared/patterns/observer';
 * 
 * export class CreateStudyGroupUseCase {
 *   async execute(dto: CreateStudyGroupDto): Promise<void> {
 *     // Crear grupo
 *     const group = new StudyGroup(...);
 *     
 *     // Guardar en BD
 *     await this.repository.save(group);
 *     
 *     // EMITIR EVENTO
 *     EventBus.getInstance().emit({
 *       eventType: 'GrupoCreado',
 *       timestamp: new Date(),
 *       aggregateId: group.id,
 *       aggregateType: 'StudyGroup',
 *       data: {
 *         groupName: group.name,
 *         creatorName: group.creatorName,
 *         creatorEmail: group.creatorEmail
 *       }
 *     });
 *   }
 * }
 * ```
 * 
 * Los observadores reaccionan automáticamente:
 * 1. AppNotificationObserver: Actualiza badge en app
 * 2. EmailNotificationObserver: Envía email
 * 3. PendingCounterObserver: Actualiza contador
 * 
 * TODO SIMULTÁNEAMENTE, sin que el Use Case sepa de ellos.
 */

import { EventEmitter, DomainEvent, Observer } from './EventEmitter';

export class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
  }

  /**
   * Obtener instancia única del EventBus (Singleton)
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
      console.log('[EventBus] Instancia creada');
    }
    return EventBus.instance;
  }

  /**
   * Registrar múltiples observadores de una vez
   */
  public subscribeMultiple(observers: Observer[]): void {
    for (const observer of observers) {
      this.subscribe(observer);
    }
  }

  /**
   * Registrar listeners de forma fluida
   */
  public static builder(): EventBusBuilder {
    return new EventBusBuilder();
  }
}

/**
 * Builder para EventBus (sintaxis fluida)
 */
export class EventBusBuilder {
  private observers: Observer[] = [];

  public addObserver(observer: Observer): this {
    this.observers.push(observer);
    return this;
  }

  public addObservers(observers: Observer[]): this {
    this.observers.push(...observers);
    return this;
  }

  public build(): EventBus {
    const eventBus = EventBus.getInstance();
    eventBus.subscribeMultiple(this.observers);
    return eventBus;
  }
}

export default EventBus;
