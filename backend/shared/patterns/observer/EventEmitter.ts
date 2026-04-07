/**
 * Observer Pattern - Base Classes
 * 
 * Observer Pattern: Define una dependencia uno-a-muchos entre objetos
 * tal que cuando uno cambia de estado, todos sus dependientes son notificados automáticamente.
 * 
 * En UniConnect:
 * - Subject: EventEmitter (emite eventos como "SolicitudConexionEnviada")
 * - Observers: Múltiples observadores que reaccionan (Email, InApp, Contador)
 * 
 * Ventaja: Los observadores son completamente independientes.
 * Si mañana agregamos un observador de SMS, no afecta los existentes.
 */

/**
 * Evento base
 */
export interface DomainEvent {
  eventType: string;
  timestamp: Date;
  aggregateId: string; // ID del objeto que cambió (userId, groupId, etc)
  aggregateType: string; // Tipo de entidad (User, StudyGroup, etc)
  data: Record<string, any>;
}

/**
 * Interfaz para observadores (listeners)
 */
export interface Observer {
  /**
   * El nombre del observador (para logging)
   */
  getName(): string;

  /**
   * Método que se ejecuta cuando ocurre el evento
   * Retorna promesa para manejar async
   */
  handle(event: DomainEvent): Promise<void>;

  /**
   * Tipos de eventos que este observador está interesado en
   */
  getInterestedEvents(): string[];
}

/**
 * Subject/Publisher: Emite eventos y notifica observadores
 */
export abstract class EventEmitter {
  private observers: Map<string, Observer[]> = new Map();

  /**
   * Registrar un observador
   * Se auto-suscribe a los eventos que le interesan
   */
  public subscribe(observer: Observer): void {
    const interestedEvents = observer.getInterestedEvents();

    for (const eventType of interestedEvents) {
      if (!this.observers.has(eventType)) {
        this.observers.set(eventType, []);
      }
      this.observers.get(eventType)!.push(observer);
    }

    console.log(
      `[Observer] ${observer.getName()} suscrito a: ${interestedEvents.join(', ')}`
    );
  }

  /**
   * Des-registrar un observador
   */
  public unsubscribe(observer: Observer): void {
    const interestedEvents = observer.getInterestedEvents();

    for (const eventType of interestedEvents) {
      const listeners = this.observers.get(eventType) || [];
      const index = listeners.indexOf(observer);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }

    console.log(
      `[Observer] ${observer.getName()} desuscrito de: ${interestedEvents.join(', ')}`
    );
  }

  /**
   * Emitir evento - notifica a TODOS los observadores interesados
   */
  public async emit(event: DomainEvent): Promise<void> {
    const listeners = this.observers.get(event.eventType) || [];

    console.log(
      `[Event] Emitiendo evento: ${event.eventType} - ${listeners.length} observadores`
    );

    // Ejecutar todos los observadores EN PARALELO (no bloquearse)
    // Cada observador reacciona independientemente
    const promises = listeners.map(async (observer) => {
      try {
        await observer.handle(event);
        console.log(`[Observer] ${observer.getName()} manejó evento exitosamente`);
      } catch (error) {
        console.error(
          `[Observer] Error en ${observer.getName()}: ${
            (error as Error).message
          }`
        );
        // No relanzar error - otros observadores deben continuar
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get observadores para un tipo de evento
   */
  public getObservers(eventType: string): Observer[] {
    return this.observers.get(eventType) || [];
  }

  /**
   * Get todos los observadores registrados
   */
  public getAllObservers(): Observer[] {
    const allObservers: Observer[] = [];
    for (const observers of this.observers.values()) {
      allObservers.push(...observers);
    }
    return [...new Set(allObservers)]; // Eliminar duplicados
  }

  /**
   * Limpiar todos los observadores
   */
  public clearAllObservers(): void {
    this.observers.clear();
  }
}

export default EventEmitter;
