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

export type MappingResult = {
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
  map(event: StudyGroupEvent): MappingResult[] {
    switch (event.type) {
      case "JOIN_REQUEST":
        return [buildNotificacion(
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
        )];

      case "MEMBER_ACCEPTED":
        return [buildNotificacion(
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
          { label: "Ver grupo", endpoint: `/study-groups/${event.requestId}`, method: "GET" },
        )];

      case "MEMBER_REJECTED":
        return [buildNotificacion(
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
        )];

      case "ADMIN_TRANSFER_REQUESTED":
        return [buildNotificacion(
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
          { label: "Revisar solicitud", endpoint: `/study-groups/transfers/${event.transferId}/accept`, method: "POST" },
        )];

      case "ADMIN_TRANSFER_ACCEPTED":
        return [buildNotificacion(
          event.oldAdminId,
          "transferencia_admin_aceptada",
          "Transferencia aceptada",
          "Tu transferencia de administracion fue aceptada.",
          {
            transferId: event.transferId,
            groupId: event.groupId,
            newAdminId: event.newAdminId,
          },
          "urgente",
          { label: "Ver grupo", endpoint: `/study-groups/${event.groupId}`, method: "GET" },
        )];

      case "ADMIN_TRANSFER_REJECTED":
        return [buildNotificacion(
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
        )];

      case "ADMIN_TRANSFER_COMPLETED":
        return [buildNotificacion(
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
          { label: "Ver grupo", endpoint: `/study-groups/${event.groupId}`, method: "GET" },
        )];

      case "ADMIN_ROLE_LEFT":
        return [buildNotificacion(
          event.userId,
          "admin_role_left",
          event.groupName,
          "Has renunciado a tu rol de administrador.",
          {
            requestId: event.requestId,
          },
          "normal",
        )];

      case "AVAILABILITY_UPDATED":
        return [buildNotificacion(
          event.organizerId,
          event.status === "confirmed" ? "asistencia_confirmada" : "asistencia_declinada",
          event.groupName,
          event.status === "confirmed"
            ? `${event.userName} ha confirmado su asistencia a tu sesion de estudio.`
            : `${event.userName} no asistira a tu sesion de estudio.`,
          {
            sessionId: event.sessionId,
            requestId: event.requestId,
            userId: event.userId,
            status: event.status,
          },
          "normal",
        )];

      case "SESSION_CANCELLED": {
        const attendeeNotifications = event.attendeeIds.map(attendeeId =>
          buildNotificacion(
            attendeeId,
            "sesion_cancelada",
            event.groupName,
            `La sesion "${event.title}" ha sido cancelada.`,
            {
              sessionId: event.sessionId,
              requestId: event.requestId,
              title: event.title,
            },
            "urgente",
          ),
        );

        if (event.cancelledBy) {
          attendeeNotifications.push(buildNotificacion(
            event.cancelledBy,
            "study_session_cancelled",
            event.title,
            "Se ha cancelado una sesión de estudio.",
            {
              sessionId: event.sessionId,
              groupId: event.groupId,
            },
            "normal",
          ));
        }

        return attendeeNotifications;
      }

      case "SESSION_CREATED": {
        const recipients = event.memberIds.filter(id => id !== event.createdBy);
        return recipients.map(memberId =>
          buildNotificacion(
            memberId,
            "nueva_sesion",
            event.groupName || event.title,
            `Se ha programado una nueva sesion de estudio para ${event.groupName}.`,
            {
              sessionId: event.sessionId,
              groupId: event.groupId,
              startTime: event.startTime,
            },
            "normal",
            { label: "Ver sesion", endpoint: `/study-groups/${event.groupId}/sessions/${event.sessionId}`, method: "GET" },
          ),
        );
      }

      default: {
        const _exhaustive: never = event;
        throw new TypeError(`Tipo de evento no soportado: ${(_exhaustive as { type: string }).type}`);
      }
    }
  }
}
