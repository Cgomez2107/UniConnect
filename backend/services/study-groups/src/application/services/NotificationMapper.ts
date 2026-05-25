import type { StudyGroupEvent } from "../../domain/events/StudyGroupEvents.js";
import type { NotificacionDTO } from "../../../../../shared/patterns/strategy/INotificationStrategy.js";
import { BaseNotification } from "../../../../../shared/patterns/decorator/notification/BaseNotification.js";
import { PriorityDecorator } from "../../../../../shared/patterns/decorator/notification/PriorityDecorator.js";
import { ActionDecorator } from "../../../../../shared/patterns/decorator/notification/ActionDecorator.js";
import type { NivelPrioridad } from "../../../../../shared/patterns/decorator/notification/PriorityDecorator.js";
import type { Accion } from "../../../../../shared/patterns/decorator/notification/ActionDecorator.js";

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

function buildNotificacion(
  userId: string,
  type: string,
  title: string,
  mensaje: string,
  payload: Record<string, unknown> | null,
  nivel: NivelPrioridad,
  accion?: Accion,
): { persistence: PersistenceInput; dto: NotificacionDTO } {
  const now = new Date().toISOString();
  let notif: import("../../../../../shared/patterns/decorator/notification/INotification.js").INotification =
    new BaseNotification({ mensaje, destinatario: userId, timestamp: now });

  notif = new PriorityDecorator(notif, nivel);

  if (accion) {
    notif = new ActionDecorator(notif, accion);
  }

  const meta = notif.toJSON() as Record<string, unknown> & { mensaje: string; nivel: NivelPrioridad; accion?: Accion };

  const dto: NotificacionDTO = {
    userId,
    type,
    title,
    body: meta.mensaje,
    payload,
    priority: meta.nivel,
    ...(meta.accion ? { action: meta.accion } : {}),
  };

  return {
    persistence: { userId, type, title, body: meta.mensaje, payload },
    dto,
  };
}

export class NotificationMapper {
  map(event: StudyGroupEvent): MappingResult {
    switch (event.type) {
      case "JOIN_REQUEST":
        return buildNotificacion(
          event.recipientUserId,
          "solicitud_ingreso",
          event.groupName,
          `${event.applicantName} quiere unirse a tu grupo.`,
          {
            requestId: event.requestId,
            applicantId: event.applicantId,
            message: event.message,
            applicantName: event.applicantName,
            groupName: event.groupName,
          },
          "normal",
        );

      case "MEMBER_ACCEPTED":
        return buildNotificacion(
          event.applicantId,
          "miembro_aceptado",
          event.groupName,
          `Tu solicitud para ${event.groupName} fue aceptada.`,
          {
            applicationId: event.applicationId,
            requestId: event.requestId,
            approvedBy: event.approvedBy,
            groupName: event.groupName,
          },
          "normal",
          { label: "Ver grupo", endpoint: `/api/v1/study-groups/${event.requestId}` },
        );

      case "MEMBER_REJECTED":
        return buildNotificacion(
          event.applicantId,
          "miembro_rechazado",
          "Solicitud rechazada",
          "Tu solicitud fue rechazada.",
          {
            applicationId: event.applicationId,
            requestId: event.requestId,
            rejectedBy: event.rejectedBy,
          },
          "normal",
        );

      case "ADMIN_TRANSFER_REQUESTED":
        return buildNotificacion(
          event.newAdminId,
          "transferencia_admin_solicitada",
          event.groupName,
          "Tienes una solicitud para transferir la administracion del grupo.",
          {
            transferId: event.transferId,
            groupId: event.groupId,
            oldAdminId: event.oldAdminId,
          },
          "urgente",
          { label: "Revisar solicitud", endpoint: `/api/v1/study-groups/transfers/${event.transferId}/accept` },
        );

      case "ADMIN_TRANSFER_ACCEPTED":
        return buildNotificacion(
          event.oldAdminId,
          "transferencia_admin_aceptada",
          "Transferencia aceptada",
          "Tu transferencia de administracion fue aceptada.",
          {
            transferId: event.transferId,
            groupId: event.groupId,
            newAdminId: event.newAdminId,
          },
          "normal",
          { label: "Ver grupo", endpoint: `/api/v1/study-groups/${event.groupId}` },
        );

      case "ADMIN_TRANSFER_REJECTED":
        return buildNotificacion(
          event.oldAdminId,
          "transferencia_admin_rechazada",
          "Transferencia rechazada",
          "La transferencia de administracion fue rechazada.",
          {
            transferId: event.transferId,
            groupId: event.groupId,
            newAdminId: event.newAdminId,
          },
          "normal",
        );

      case "ADMIN_TRANSFER_COMPLETED":
        return buildNotificacion(
          event.newAdminId,
          "transferencia_admin_transferida",
          event.groupName,
          "Ahora eres administrador del grupo.",
          {
            transferId: event.transferId,
            groupId: event.groupId,
            oldAdminId: event.oldAdminId,
          },
          "urgente",
          { label: "Ver grupo", endpoint: `/api/v1/study-groups/${event.groupId}` },
        );

      case "ADMIN_ROLE_LEFT":
        return buildNotificacion(
          event.userId,
          "admin_role_left",
          event.groupName,
          "Has renunciado a tu rol de administrador.",
          {
            requestId: event.requestId,
          },
          "normal",
        );

      case "SESSION_CREATED":
        return buildNotificacion(
          event.createdBy,
          "study_session_created",
          event.title,
          "Se ha creado una nueva sesión de estudio.",
          {
            sessionId: event.sessionId,
            groupId: event.groupId,
            startTime: event.startTime,
          },
          "normal",
        );

      case "SESSION_CANCELLED":
        return buildNotificacion(
          event.cancelledBy,
          "study_session_cancelled",
          event.title,
          "Se ha cancelado una sesión de estudio.",
          {
            sessionId: event.sessionId,
            groupId: event.groupId,
          },
          "normal",
        );

      default: {
        const _exhaustive: never = event;
        throw new TypeError(`Tipo de evento no soportado: ${(_exhaustive as { type: string }).type}`);
      }
    }
  }
}
