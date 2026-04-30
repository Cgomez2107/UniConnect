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

import type { INotificationRepository } from "../../repositories/INotificationRepository.js";
import type { StudyGroupEvent } from "../StudyGroupEvents.js";
import type { IObserver } from "./IObserver.js";

/**
 * Observer que persiste eventos como notificaciones
 *
 * Flujo:
 * 1. Subject emite evento (ej: SOLICITUD_INGRESO)
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
      case "SOLICITUD_INGRESO":
        await this.notificationRepository.create({
          userId: event.recipientUserId,
          type: "solicitud_ingreso",
          title: event.groupName, // Usamos el nombre del grupo como título
          body: `${event.applicantName} quiere unirse a tu grupo.`,
          payload: {
            requestId: event.requestId,
            applicantId: event.applicantId,
            message: event.message,
            applicantName: event.applicantName,
            groupName: event.groupName,
          },
        });
        break;

      case "MIEMBRO_ACEPTADO":
        await this.notificationRepository.create({
          userId: event.applicantId,
          type: "miembro_aceptado",
          title: event.groupName, // Usamos el nombre del grupo como título
          body: `Tu solicitud para ${event.groupName} fue aceptada.`,
          payload: {
            applicationId: event.applicationId,
            requestId: event.requestId,
            approvedBy: event.approvedBy,
            groupName: event.groupName,
          },
        });
        break;

      case "MIEMBRO_RECHAZADO":
        await this.notificationRepository.create({
          userId: event.applicantId,
          type: "miembro_rechazado",
          title: "Solicitud rechazada",
          body: "Tu solicitud fue rechazada.",
          payload: {
            applicationId: event.applicationId,
            requestId: event.requestId,
            rejectedBy: event.rejectedBy,
          },
        });
        break;

      case "TRANSFERENCIA_ADMIN_SOLICITADA":
        await this.notificationRepository.create({
          userId: event.targetUserId,
          type: "transferencia_admin_solicitada",
          title: event.groupName, // Usamos el nombre del grupo
          body: "Tienes una solicitud para transferir la administracion del grupo.",
          payload: {
            transferId: event.transferId,
            requestId: event.requestId,
            actorUserId: event.actorUserId,
          },
        });
        break;

      case "TRANSFERENCIA_ADMIN_ACEPTADA":
        await this.notificationRepository.create({
          userId: event.fromUserId,
          type: "transferencia_admin_aceptada",
          title: "Transferencia aceptada",
          body: "Tu transferencia de administracion fue aceptada.",
          payload: {
            transferId: event.transferId,
            requestId: event.requestId,
            toUserId: event.toUserId,
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
