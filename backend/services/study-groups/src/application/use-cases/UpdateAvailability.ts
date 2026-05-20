import type { SessionAttendee, AttendeeStatus } from "../../domain/entities/SessionAttendee.js";
import type { ISessionAttendeeRepository } from "../../domain/repositories/ISessionAttendeeRepository.js";
import type { IStudySessionRepository } from "../../domain/repositories/IStudySessionRepository.js";
import type { IStudyGroupRepository } from "../../domain/repositories/IStudyGroupRepository.js";
import type { ISubject } from "../../domain/events/observers/ISubject.js";
import { NotFoundError, AuthorizationError } from "../../../../../shared/libs/errors/index.js";

export class UpdateAvailability {
  constructor(
    private readonly attendeeRepository: ISessionAttendeeRepository,
    private readonly sessionRepository: IStudySessionRepository,
    private readonly studyGroupRepository: IStudyGroupRepository,
    private readonly subject: ISubject,
  ) {}

  async execute(
    sessionId: string,
    userId: string,
    userName: string,
    status: AttendeeStatus,
  ): Promise<SessionAttendee> {
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

    const isMember = await this.sessionRepository.isGroupMember(session.requestId, userId);
    if (!isMember) {
      throw new AuthorizationError("You are not a member of this group.");
    }

    const attendee = await this.attendeeRepository.upsert(sessionId, userId, status);

    await this.subject.emit({
      type: "AVAILABILITY_UPDATED",
      version: "1.0",
      timestamp: new Date(),
      sessionId,
      requestId: session.requestId,
      userId,
      userName,
      status: status as "confirmed" | "declined",
      groupName: group.groupName ?? "",
      organizerId: group.adminId,
    });

    return attendee;
  }
}
