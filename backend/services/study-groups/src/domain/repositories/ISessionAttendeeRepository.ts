import type { SessionAttendee, SessionAttendeeWithUser, AttendeeStatus } from "../entities/SessionAttendee.js";

export interface ISessionAttendeeRepository {
  upsert(sessionId: string, userId: string, status: AttendeeStatus): Promise<SessionAttendee>;
  listBySessionId(sessionId: string): Promise<SessionAttendeeWithUser[]>;
  getBySessionAndUser(sessionId: string, userId: string): Promise<SessionAttendee | null>;
  createPendingForMember(sessionId: string, userId: string): Promise<SessionAttendee>;
}
