/**
 * WebSocketNotificationObserver.ts
 *
 * Observer que emite notificaciones en tiempo real via WebSocket.
 */

import type { StudyGroupEvent } from "../StudyGroupEvents.js";
import type { IObserver } from "./IObserver.js";

export interface IStudyGroupSocketGateway {
  emitToUser(
    userId: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void>;
}

export class WebSocketNotificationObserver implements IObserver {
  readonly name = "WebSocketNotificationObserver";

  constructor(private readonly socketGateway: IStudyGroupSocketGateway) {}

  async handle(event: StudyGroupEvent): Promise<void> {
    switch (event.type) {
      case "SOLICITUD_INGRESO":
        await this.socketGateway.emitToUser(
          event.recipientUserId,
          "study-group:application:created",
          {
            requestId: event.requestId,
            applicantId: event.applicantId,
            message: event.message,
          },
        );
        break;

      case "MIEMBRO_ACEPTADO":
        await this.socketGateway.emitToUser(
          event.applicantId,
          "study-group:application:accepted",
          {
            applicationId: event.applicationId,
            requestId: event.requestId,
            approvedBy: event.approvedBy,
          },
        );
        break;

      case "MIEMBRO_RECHAZADO":
        await this.socketGateway.emitToUser(
          event.applicantId,
          "study-group:application:rejected",
          {
            applicationId: event.applicationId,
            requestId: event.requestId,
            rejectedBy: event.rejectedBy,
          },
        );
        break;

      case "TRANSFERENCIA_ADMIN_SOLICITADA":
        await this.socketGateway.emitToUser(
          event.targetUserId,
          "study-group:admin-transfer:requested",
          {
            transferId: event.transferId,
            requestId: event.requestId,
            actorUserId: event.actorUserId,
          },
        );
        break;

      case "TRANSFERENCIA_ADMIN_ACEPTADA":
        await this.socketGateway.emitToUser(
          event.fromUserId,
          "study-group:admin-transfer:accepted",
          {
            transferId: event.transferId,
            requestId: event.requestId,
            toUserId: event.toUserId,
          },
        );
        break;
    }
  }
}
