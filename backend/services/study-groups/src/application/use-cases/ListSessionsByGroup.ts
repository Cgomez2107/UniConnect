import type { StudySession } from "../../domain/entities/StudySession.js";
import type { IStudySessionRepository, ListSessionsFilters } from "../../domain/repositories/IStudySessionRepository.js";
import type { ISessionAttendeeRepository } from "../../domain/repositories/ISessionAttendeeRepository.js";
import type { SessionAttendeeWithUser } from "../../domain/entities/SessionAttendee.js";

export interface ListSessionsQuery {
  from?: string;
  to?: string;
  status?: string;
}

export class ListSessionsByGroup {
  constructor(
    private readonly sessionRepository: IStudySessionRepository,
    private readonly attendeeRepository: ISessionAttendeeRepository,
  ) {}

  async execute(requestId: string, query?: ListSessionsQuery): Promise<StudySession[]> {
    return this.sessionRepository.listByRequestId(requestId, query as ListSessionsFilters);
  }

  async listAttendees(sessionId: string): Promise<SessionAttendeeWithUser[]> {
    return this.attendeeRepository.listBySessionId(sessionId);
  }
}
