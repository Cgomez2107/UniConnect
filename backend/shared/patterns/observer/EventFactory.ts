/**
 * Ejemplos de eventos que pueden ser emitidos en UniConnect
 * 
 * Eventos de Solicitudes (Study Requests):
 * - SolicitudConexionEnviada
 * - SolicitudRecibida
 * - SolicitudAceptada
 * - SolicitudRechazada
 * 
 * Eventos de Aplicaciones (Application):
 * - SolicitudParaGrupoEnviada
 * - SolicitudParaGrupoRecibida
 * - SolicitudParaGrupoAceptada
 * 
 * Eventos de Grupos (Study Groups):
 * - GrupoCreado
 * - MiembroAgregado
 * - MiembroRemovido
 * 
 * Eventos de Mensajes:
 * - NuevoMensaje
 * - ConversacionIniciada
 * 
 * Eventos de Eventos:
 * - EventoCreado
 * - EventoActualizado
 * - EventoCancelado
 */

import { DomainEvent } from './EventEmitter';

/**
 * Factory helper para crear eventos
 */
export class EventFactory {
  /**
   * Evento: Solicitud de conexión enviada
   */
  public static connectionRequestSent(
    senderId: string,
    senderName: string,
    senderEmail: string,
    receiverId: string,
    subjectName: string
  ): DomainEvent {
    return {
      eventType: 'SolicitudConexionEnviada',
      timestamp: new Date(),
      aggregateId: senderId,
      aggregateType: 'User',
      data: {
        userId: receiverId,
        senderName,
        senderEmail,
        subjectName,
      },
    };
  }

  /**
   * Evento: Solicitud recibida para grupo
   */
  public static applicationReceivedForGroup(
    applicantId: string,
    applicantName: string,
    groupId: string,
    groupName: string,
    adminId: string
  ): DomainEvent {
    return {
      eventType: 'SolicitudRecibida',
      timestamp: new Date(),
      aggregateId: groupId,
      aggregateType: 'StudyGroup',
      data: {
        groupId,
        groupName,
        userId: adminId, // Quien recibe la notificación
        applicantName,
        applicantId,
      },
    };
  }

  /**
   * Evento: Grupo creado
   */
  public static groupCreated(
    groupId: string,
    groupName: string,
    creatorId: string,
    creatorName: string,
    creatorEmail: string,
    subjectName: string
  ): DomainEvent {
    return {
      eventType: 'GrupoCreado',
      timestamp: new Date(),
      aggregateId: groupId,
      aggregateType: 'StudyGroup',
      data: {
        groupName,
        groupId,
        creatorId,
        creatorName,
        creatorEmail,
        subjectName,
      },
    };
  }

  /**
   * Evento: Nuevo mensaje
   */
  public static newMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    receiverId: string,
    messagePreview: string
  ): DomainEvent {
    return {
      eventType: 'NuevoMensaje',
      timestamp: new Date(),
      aggregateId: conversationId,
      aggregateType: 'Conversation',
      data: {
        conversationId,
        senderId,
        senderName,
        receiverId,
        messagePreview,
      },
    };
  }

  /**
   * Evento: Evento académico creado
   */
  public static eventCreated(
    eventId: string,
    eventName: string,
    eventDate: Date,
    creatorId: string,
    creatorName: string
  ): DomainEvent {
    return {
      eventType: 'EventoCreado',
      timestamp: new Date(),
      aggregateId: eventId,
      aggregateType: 'Event',
      data: {
        eventId,
        eventName,
        eventDate,
        creatorId,
        creatorName,
      },
    };
  }

  /**
   * Evento: Solicitud aceptada
   */
  public static applicationAccepted(
    applicationId: string,
    applicantId: string,
    userId: string
  ): DomainEvent {
    return {
      eventType: 'SolicitudAceptada',
      timestamp: new Date(),
      aggregateId: applicationId,
      aggregateType: 'Application',
      data: {
        applicationId,
        applicantId,
        userId,
      },
    };
  }

  /**
   * Evento: Solicitud rechazada
   */
  public static applicationRejected(
    applicationId: string,
    applicantId: string,
    userId: string
  ): DomainEvent {
    return {
      eventType: 'SolicitudRechazada',
      timestamp: new Date(),
      aggregateId: applicationId,
      aggregateType: 'Application',
      data: {
        applicationId,
        applicantId,
        userId,
      },
    };
  }
}

export default EventFactory;
