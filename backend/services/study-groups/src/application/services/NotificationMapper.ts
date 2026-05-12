import type { StudyGroupEvent } from "../../domain/events/StudyGroupEvents.js";
import type { NotificacionDTO } from "../../../../../shared/patterns/strategy/INotificationStrategy.js";

type PersistenceInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
};

type MappingResult = {
  persistence: PersistenceInput;
  dto: NotificacionDTO;
};

export class NotificationMapper {
  map(event: StudyGroupEvent): MappingResult {
    switch (event.type) {
      case "SOLICITUD_INGRESO":
        return {
          persistence: {
            userId: event.recipientUserId,
            type: "solicitud_ingreso",
            title: event.groupName,
            body: `${event.applicantName} quiere unirse a tu grupo.`,
            payload: {
              requestId: event.requestId,
              applicantId: event.applicantId,
              message: event.message,
              applicantName: event.applicantName,
              groupName: event.groupName,
            },
          },
          dto: {
            userId: event.recipientUserId,
            type: "solicitud_ingreso",
            title: event.groupName,
            body: `${event.applicantName} quiere unirse a tu grupo.`,
            payload: {
              requestId: event.requestId,
              applicantId: event.applicantId,
              message: event.message,
              applicantName: event.applicantName,
              groupName: event.groupName,
            },
            priority: "normal",
          },
        };

      case "MIEMBRO_ACEPTADO":
        return {
          persistence: {
            userId: event.applicantId,
            type: "miembro_aceptado",
            title: event.groupName,
            body: `Tu solicitud para ${event.groupName} fue aceptada.`,
            payload: {
              applicationId: event.applicationId,
              requestId: event.requestId,
              approvedBy: event.approvedBy,
              groupName: event.groupName,
            },
          },
          dto: {
            userId: event.applicantId,
            type: "miembro_aceptado",
            title: event.groupName,
            body: `Tu solicitud para ${event.groupName} fue aceptada.`,
            payload: {
              applicationId: event.applicationId,
              requestId: event.requestId,
              approvedBy: event.approvedBy,
              groupName: event.groupName,
            },
            priority: "normal",
          },
        };

      case "MIEMBRO_RECHAZADO":
        return {
          persistence: {
            userId: event.applicantId,
            type: "miembro_rechazado",
            title: "Solicitud rechazada",
            body: "Tu solicitud fue rechazada.",
            payload: {
              applicationId: event.applicationId,
              requestId: event.requestId,
              rejectedBy: event.rejectedBy,
            },
          },
          dto: {
            userId: event.applicantId,
            type: "miembro_rechazado",
            title: "Solicitud rechazada",
            body: "Tu solicitud fue rechazada.",
            payload: {
              applicationId: event.applicationId,
              requestId: event.requestId,
              rejectedBy: event.rejectedBy,
            },
            priority: "normal",
          },
        };

      case "TRANSFERENCIA_ADMIN_SOLICITADA":
        return {
          persistence: {
            userId: event.newAdminId,
            type: "transferencia_admin_solicitada",
            title: event.groupName,
            body: "Tienes una solicitud para transferir la administracion del grupo.",
            payload: {
              transferId: event.transferId,
              groupId: event.groupId,
              oldAdminId: event.oldAdminId,
            },
          },
          dto: {
            userId: event.newAdminId,
            type: "transferencia_admin_solicitada",
            title: event.groupName,
            body: "Tienes una solicitud para transferir la administracion del grupo.",
            payload: {
              transferId: event.transferId,
              groupId: event.groupId,
              oldAdminId: event.oldAdminId,
            },
            priority: "urgente",
          },
        };

      case "TRANSFERENCIA_ADMIN_ACEPTADA":
        return {
          persistence: {
            userId: event.oldAdminId,
            type: "transferencia_admin_aceptada",
            title: "Transferencia aceptada",
            body: "Tu transferencia de administracion fue aceptada.",
            payload: {
              transferId: event.transferId,
              groupId: event.groupId,
              newAdminId: event.newAdminId,
            },
          },
          dto: {
            userId: event.oldAdminId,
            type: "transferencia_admin_aceptada",
            title: "Transferencia aceptada",
            body: "Tu transferencia de administracion fue aceptada.",
            payload: {
              transferId: event.transferId,
              groupId: event.groupId,
              newAdminId: event.newAdminId,
            },
            priority: "normal",
          },
        };
    default: {
      const _exhaustive: never = event;
      throw new TypeError(`Tipo de evento no soportado: ${(_exhaustive as { type: string }).type}`);
    }
  }
}
}
