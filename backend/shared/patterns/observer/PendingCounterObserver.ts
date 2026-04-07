/**
 * Observer 3: Actualizar Contador de Pendientes
 * 
 * Cuando un usuario recibe solicitudes:
 * - Incrementar contador de "pendientes"
 * - Guardar en caché (Redis)
 * - Usar para mostrar badge en UI
 */

import { Observer, DomainEvent } from './EventEmitter';

export class PendingCounterObserver implements Observer {
  
  // En producción, esto sería inyectado (Redis client, logger, etc)
  private pendingCounters: Map<string, number> = new Map();

  getName(): string {
    return 'PendingCounterObserver';
  }

  /**
   * Este observador solo cuenta eventos que generan "pendientes"
   */
  getInterestedEvents(): string[] {
    return [
      'SolicitudConexionEnviada',
      'SolicitudRecibida',
      'SolicitudAceptada',
      'SolicitudRechazada',
    ];
  }

  /**
   * Manejar el evento
   */
  public async handle(event: DomainEvent): Promise<void> {
    const { userId } = event.data;

    switch (event.eventType) {
      case 'SolicitudConexionEnviada':
        this.incrementPending(userId);
        break;
      case 'SolicitudRecibida':
        this.incrementPending(userId);
        break;
      case 'SolicitudAceptada':
      case 'SolicitudRechazada':
        this.decrementPending(userId);
        break;
    }
  }

  private incrementPending(userId: string): void {
    const current = this.pendingCounters.get(userId) || 0;
    const newCount = current + 1;
    this.pendingCounters.set(userId, newCount);
    
    console.log(
      `⏳ [PendingCounter] Usuario ${userId}: ${newCount} solicitudes pendientes`
    );

    // En producción: guardar en Redis
    // await redis.set(`pending:${userId}`, newCount);
    // await redis.expire(`pending:${userId}`, 86400); // 24 horas
  }

  private decrementPending(userId: string): void {
    const current = this.pendingCounters.get(userId) || 0;
    const newCount = Math.max(0, current - 1);
    this.pendingCounters.set(userId, newCount);
    
    console.log(
      `⏳ [PendingCounter] Usuario ${userId}: ${newCount} solicitudes pendientes`
    );

    // En producción: actualizar en Redis
    // await redis.set(`pending:${userId}`, newCount);
  }

  /**
   * Método para obtener el contador (usado por frontend)
   */
  public getPendingCount(userId: string): number {
    return this.pendingCounters.get(userId) || 0;
  }
}

export default PendingCounterObserver;
