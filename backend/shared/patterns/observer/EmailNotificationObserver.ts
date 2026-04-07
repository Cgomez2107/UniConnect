/**
 * Observer 2: Notificación por Email
 * 
 * Cuando ocurren ciertos eventos:
 * - Generar email
 * - Enviar a dirección institucional
 * - Loguear envío
 */

import { Observer, DomainEvent } from './EventEmitter';

export class EmailNotificationObserver implements Observer {
  
  getName(): string {
    return 'EmailNotificationObserver';
  }

  /**
   * Este observador solo está interesado en eventos IMPORTANTES
   */
  getInterestedEvents(): string[] {
    return [
      'SolicitudConexionEnviada',
      'SolicitudRecibida',
      'EventoCreado',
      'GrupoCreado',
    ];
  }

  /**
   * Manejar el evento
   */
  public async handle(event: DomainEvent): Promise<void> {
    // Simular latencia de envío de email
    await new Promise(resolve => setTimeout(resolve, 200));

    console.log(
      `📧 [EmailNotification] Enviando email para: ${event.eventType}`
    );

    switch (event.eventType) {
      case 'SolicitudConexionEnviada':
        await this.sendConnectionRequestEmail(event);
        break;
      case 'SolicitudRecibida':
        await this.sendApplicationEmail(event);
        break;
      case 'EventoCreado':
        await this.sendEventNotificationEmail(event);
        break;
      case 'GrupoCreado':
        await this.sendGroupCreatedEmail(event);
        break;
    }
  }

  private async sendConnectionRequestEmail(event: DomainEvent): Promise<void> {
    const { userId, senderName, senderEmail } = event.data;
    console.log(
      `📧 Email enviado a ${userId}: "${senderName}" (${senderEmail}) te solicita conexión`
    );
    // En producción: usar SendGrid, Mailgun, etc
    // await emailService.send({
    //   to: userEmail,
    //   subject: 'Nueva solicitud de conexión',
    //   template: 'connection-request',
    //   data: { senderName, senderEmail }
    // });
  }

  private async sendApplicationEmail(event: DomainEvent): Promise<void> {
    const { groupId, applicantName, groupName } = event.data;
    console.log(
      `📧 Email enviado: "${applicantName}" se unió al grupo "${groupName}"`
    );
  }

  private async sendEventNotificationEmail(event: DomainEvent): Promise<void> {
    const { eventName, eventDate } = event.data;
    console.log(
      `📧 Email enviado: Nuevo evento "${eventName}" el ${eventDate}`
    );
  }

  private async sendGroupCreatedEmail(event: DomainEvent): Promise<void> {
    const { groupName, creatorName } = event.data;
    console.log(
      `📧 Email enviado: ${creatorName} creó el grupo "${groupName}"`
    );
  }
}

export default EmailNotificationObserver;
