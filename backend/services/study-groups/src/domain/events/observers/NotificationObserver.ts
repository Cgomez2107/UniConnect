/**
 * NotificationObserver.ts
 *
 * Ejemplo concreto de Observer que persiste eventos como notificaciones.
 *
 * Responsabilidad:
 * - Escuchar eventos del dominio
 * - Convertirlos en notificaciones persistidas
 * - Almacenarlos en BD para que usuarios puedan verlas después
 */

import type { IObserver } from "./IObserver.js";
import type { StudyGroupEvent } from "../StudyGroupEvents.js";

/**
 * Interfaz para el repositorio que persiste notificaciones
 * (Abstracta para no depender de BD directamente)
 */
export interface INotificationRepository {
  /**
   * Crea una notificación persistida en BD
   */
  create(notification: {
    userId: string;
    eventType: string;
    title: string;
    description: string;
    metadata: Record<string, unknown>;
  }): Promise<string>;
}

/**
 * Observer que persiste eventos como notificaciones
 *
 * Flujo:
 * 1. Subject emite evento (ej: StudentJoined)
 * 2. NotificationObserver.handle() se ejecuta
 * 3. Convierte evento a notificación
 * 4. Persiste en BD
 */
export class NotificationObserver implements IObserver {
  readonly name = "NotificationObserver";

  constructor(private readonly notificationRepository: INotificationRepository) {}

  async handle(event: StudyGroupEvent): Promise<void> {
    // Mapear cada tipo de evento a una notificación específica
    switch (event.type) {
      case "StudentJoined":
        await this.notificationRepository.create({
          userId: event.studentId,
          eventType: "student_joined",
          title: "Te uniste a un grupo",
          description: `Te has unido al grupo exitosamente.`,
          metadata: {
            groupId: event.groupId,
            studentName: event.studentName,
            totalMembers: event.totalMembers,
          },
        });
        break;

      case "StudentLeft":
        await this.notificationRepository.create({
          userId: event.studentId,
          eventType: "student_left",
          title: "Abandonaste un grupo",
          description: `Has abandonado el grupo.`,
          metadata: {
            groupId: event.groupId,
            totalMembers: event.totalMembers,
          },
        });
        break;

      case "GroupCreated":
        await this.notificationRepository.create({
          userId: event.authorId,
          eventType: "group_created",
          title: "Grupo creado",
          description: `Has creado el grupo "${event.title}" para ${event.subject}.`,
          metadata: {
            groupId: event.groupId,
            title: event.title,
            subject: event.subject,
            maxMembers: event.maxMembers,
          },
        });
        break;

      case "GroupClosed":
        // Notificar a todos los miembros (aquí simplificado)
        await this.notificationRepository.create({
          userId: event.groupId,
          eventType: "group_closed",
          title: "Grupo cerrado",
          description: `El grupo ha sido cerrado. Razón: ${event.reason}`,
          metadata: {
            groupId: event.groupId,
            reason: event.reason,
          },
        });
        break;

      case "ApplicationApproved":
        await this.notificationRepository.create({
          userId: event.applicantId,
          eventType: "application_approved",
          title: "Solicitud aceptada",
          description: `Tu solicitud ha sido aceptada. Ya formas parte del grupo.`,
          metadata: {
            applicationId: event.applicationId,
            groupId: event.groupId,
            approvedBy: event.approvedBy,
          },
        });
        break;

      case "ApplicationRejected":
        await this.notificationRepository.create({
          userId: event.applicantId,
          eventType: "application_rejected",
          title: "Solicitud rechazada",
          description: `Tu solicitud ha sido rechazada.`,
          metadata: {
            applicationId: event.applicationId,
            groupId: event.groupId,
            rejectedBy: event.rejectedBy,
          },
        });
        break;

      default:
        // Tipo de evento desconocido (nunca debería pasar con tipos tipados)
        const exhaustiveCheck: never = event;
        throw new Error(`Evento no manejado: ${exhaustiveCheck}`);
    }
  }
}
