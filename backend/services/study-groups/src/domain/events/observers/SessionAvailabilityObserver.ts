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
        await this.broadcastToGroupMembers(event.groupId, "study-session:cancelled", {
          sessionId: event.sessionId,
          groupId: event.groupId,
          title: event.title,
        });
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
}
