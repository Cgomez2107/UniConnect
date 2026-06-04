import type { StudyGroupEvent } from "../StudyGroupEvents.js";
import type { IObserver } from "./IObserver.js";
import type { IStudyGroupSocketGateway } from "./WebSocketNotificationObserver.js";
import type { IMemberRepository } from "../../repositories/IMemberRepository.js";

export class SessionAvailabilityObserver implements IObserver {
  readonly name = "SessionAvailabilityObserver";

  constructor(
    private readonly socketGateway: IStudyGroupSocketGateway,
    private readonly memberRepository: IMemberRepository,
  ) {}

  async handle(event: StudyGroupEvent): Promise<void> {
    switch (event.type) {
      case "SESSION_CREATED":
        await this.broadcastToGroupMembers(event.groupId, "study-session:created", {
          sessionId: event.sessionId,
          groupId: event.groupId,
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
        });
        break;

      case "SESSION_CANCELLED":
        if (!event.groupId) break;
        await this.broadcastToGroupMembers(event.groupId, "study-session:cancelled", {
          sessionId: event.sessionId,
          groupId: event.groupId,
          title: event.title,
        });
        break;

      case "AVAILABILITY_UPDATED":
        // Criterio 7: Notificar al organizador cuando un participante actualiza su disponibilidad
        await this.notifyOrganizer(event);
        break;
    }
  }

  private async broadcastToGroupMembers(
    groupId: string,
    eventName: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      const members = await this.memberRepository.findByGroup(groupId);
      const promises = members.map(member =>
        this.socketGateway
          .emitToUser(member.userId, eventName, payload)
          .catch(err => {
            console.error(
              JSON.stringify({
                observer: this.name,
                error: "Failed to emit to user",
                userId: member.userId,
                eventName,
                errorMessage: (err as Error).message,
              }),
            );
          }),
      );
      await Promise.all(promises);
    } catch (err) {
      console.error(
        JSON.stringify({
          observer: this.name,
          error: "Failed to broadcast to group members",
          groupId,
          eventName,
          errorMessage: (err as Error).message,
        }),
      );
    }
  }

  private async notifyOrganizer(event: any): Promise<void> {
    try {
      const statusText = event.status === "confirmed" ? "ha confirmado" : "ha declinado";
      const payload = {
        sessionId: event.sessionId,
        requestId: event.requestId,
        userId: event.userId,
        userName: event.userName,
        status: event.status,
        groupName: event.groupName,
        message: `${event.userName} ${statusText} su asistencia a la sesión de estudio.`,
      };

      await this.socketGateway
        .emitToUser(event.organizerId, "study-session:availability-updated", payload)
        .catch(err => {
          console.error(
            JSON.stringify({
              observer: this.name,
              error: "Failed to notify organizer",
              organizerId: event.organizerId,
              sessionId: event.sessionId,
              errorMessage: (err as Error).message,
            }),
          );
        });
    } catch (err) {
      console.error(
        JSON.stringify({
          observer: this.name,
          error: "Failed to notify organizer",
          sessionId: event.sessionId,
          errorMessage: (err as Error).message,
        }),
      );
    }
  }
}
