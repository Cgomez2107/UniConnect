import type { StudySession } from "../../domain/entities/StudySession.js";
import type { IStudySessionRepository } from "../../domain/repositories/IStudySessionRepository.js";
import type { ISubject } from "../../domain/events/observers/ISubject.js";

export class CancelStudySession {
  constructor(
    private readonly repository: IStudySessionRepository,
    private readonly subject?: ISubject,
  ) {}

  async execute(sessionId: string, actorUserId: string): Promise<StudySession> {
    if (!sessionId) throw new Error("Session ID is required");

    const session = await this.repository.cancel(sessionId, actorUserId);

    if (this.subject) {
      await this.subject.emit({
        type: "SESSION_CANCELLED",
        version: "1.0",
        timestamp: new Date(),
        sessionId: session.id,
        groupId: session.groupId,
        title: session.title,
        cancelledBy: actorUserId,
      });
    }

    return session;
  }
}
