import type { StudySession } from "../../domain/entities/StudySession.js";
import type { IStudySessionRepository } from "../../domain/repositories/IStudySessionRepository.js";
import type { ISessionAttendeeRepository } from "../../domain/repositories/ISessionAttendeeRepository.js";
import type { IStudyGroupRepository } from "../../domain/repositories/IStudyGroupRepository.js";
import type { ISubject } from "../../domain/events/observers/ISubject.js";
import { NotFoundError, AuthorizationError, ConflictError } from "../../../../../shared/libs/errors/index.js";

export class CancelStudySession {
  constructor(
    private readonly sessionRepository: IStudySessionRepository,
    private readonly studyGroupRepository: IStudyGroupRepository,
    private readonly attendeeRepository: ISessionAttendeeRepository,
    private readonly subject: ISubject,
  ) {}

  async execute(sessionId: string, actorUserId: string): Promise<StudySession> {
    const session = await this.sessionRepository.getById(sessionId);
    if (!session) {
      throw new NotFoundError("Study session not found.");
    }

    const group = await this.studyGroupRepository.loadStudyGroup(session.requestId, {
      subscribe: () => {},
      unsubscribe: () => {},
      emit: async () => {},
    });

    if (!group) {
      throw new NotFoundError("Study group not found.");
    }

    if (group.adminId !== actorUserId) {
      throw new AuthorizationError("Only the group author or an admin can cancel sessions.");
    }

    if (session.status === "cancelled") {
      throw new ConflictError("Session is already cancelled.");
    }

    const updated = await this.sessionRepository.cancel(sessionId);

    const attendees = await this.attendeeRepository.listBySessionId(sessionId);
    const attendeeIds = attendees.map(a => a.userId);

    await this.subject.emit({
      type: "SESSION_CANCELLED",
      version: "1.0",
      timestamp: new Date(),
      sessionId: session.id,
      requestId: session.requestId,
      title: session.title,
      groupName: group.groupName ?? "",
      attendeeIds,
    });

    return updated;
  }
}
