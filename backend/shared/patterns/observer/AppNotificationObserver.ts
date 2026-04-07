/**
 * Observer 1: Notificación en App
 * 
 * Cuando alguien envía una solicitud de conexión:
 * - Esperar 2 segundos
 * - Actualizar badge en app (contador de pendientes)
 * - Mostrar notificación in-app
 */

import { Observer, DomainEvent } from './EventEmitter';

export class AppNotificationObserver implements Observer {
  
  getName(): string {
    return 'AppNotificationObserver';
  }

  /**
   * Este observador está interesado en estos eventos
   */
  getInterestedEvents(): string[] {
    return [
      'SolicitudConexionEnviada',
      'SolicitudRecibida',
      'NuevoMensaje',
      'EventoCreado',
    ];
  }

  /**
   * Manejar el evento
   */
  public async handle(event: DomainEvent): Promise<void> {
    // Simular latencia de procesamiento
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log(
      `📱 [AppNotification] Procesando evento: ${event.eventType}`
    );

    switch (event.eventType) {
      case 'SolicitudConexionEnviada':
        await this.handleConnectionRequest(event);
        break;
      case 'SolicitudRecibida':
        await this.handleApplicationReceived(event);
        break;
      case 'NuevoMensaje':
        await this.handleNewMessage(event);
        break;
      case 'EventoCreado':
        await this.handleEventCreated(event);
        break;
    }
  }

  private async handleConnectionRequest(event: DomainEvent): Promise<void> {
    const { userId, senderName } = event.data;
    console.log(`📱 Actualizar badge: ${senderName} envió solicitud de conexión a ${userId}`);
    // En producción: enviar notificación push a Flutter app
    // await notificationService.updateBadge(userId, '1');
  }

  private async handleApplicationReceived(event: DomainEvent): Promise<void> {
    const { userId, applicantName } = event.data;
    console.log(`📱 Notificación: ${applicantName} solicitó unirse a tu grupo`);
    // En producción: mostrar notificación in-app
  }

  private async handleNewMessage(event: DomainEvent): Promise<void> {
    const { conversationId, senderName } = event.data;
    console.log(`📱 Nuevo mensaje en conversación ${conversationId} de ${senderName}`);
  }

  private async handleEventCreated(event: DomainEvent): Promise<void> {
    const { eventName } = event.data;
    console.log(`📱 Nuevo evento: ${eventName}`);
  }
}

export default AppNotificationObserver;
