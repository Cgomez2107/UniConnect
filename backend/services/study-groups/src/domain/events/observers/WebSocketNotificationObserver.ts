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
      case "JOIN_REQUEST":
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

      case "MEMBER_ACCEPTED":
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

      case "MEMBER_REJECTED":
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

      case "ADMIN_TRANSFER_REQUESTED":
        await this.socketGateway.emitToUser(
          event.newAdminId,
          "study-group:admin-transfer:requested",
          {
            transferId: event.transferId,
            requestId: event.groupId,
            actorUserId: event.oldAdminId,
          },
        );
        break;

      case "ADMIN_TRANSFER_ACCEPTED":
        await this.socketGateway.emitToUser(
          event.oldAdminId,
          "study-group:admin-transfer:accepted",
          {
            transferId: event.transferId,
            requestId: event.groupId,
            toUserId: event.newAdminId,
          },
        );
        break;

      case "ADMIN_TRANSFER_REJECTED":
        await this.socketGateway.emitToUser(
          event.oldAdminId,
          "study-group:admin-transfer:rejected",
          {
            transferId: event.transferId,
            requestId: event.groupId,
            toUserId: event.newAdminId,
          },
        );
        break;

      case "ADMIN_TRANSFER_COMPLETED":
        await this.socketGateway.emitToUser(
          event.newAdminId,
          "study-group:admin-transfer:completed",
          {
            transferId: event.transferId,
            requestId: event.groupId,
            oldAdminId: event.oldAdminId,
          },
        );
        break;
    }
  }
}
