import type { SessionAttendee, SessionAttendeeWithUser, AttendeeStatus } from "../../domain/entities/SessionAttendee.js";
import type { ISessionAttendeeRepository } from "../../domain/repositories/ISessionAttendeeRepository.js";

export class InMemorySessionAttendeeRepository implements ISessionAttendeeRepository {
  private attendees: Map<string, SessionAttendee> = new Map();
  private userNames: Map<string, string> = new Map();

  setUserName(userId: string, name: string): void {
    this.userNames.set(userId, name);
  }

  async upsert(sessionId: string, userId: string, status: AttendeeStatus): Promise<SessionAttendee> {
    const now = new Date().toISOString();
    const existing = Array.from(this.attendees.values()).find(
      a => a.sessionId === sessionId && a.userId === userId,
    );

    if (existing) {
      const updated: SessionAttendee = { ...existing, status, updatedAt: now };
      this.attendees.set(existing.id, updated);
      return updated;
    }

    const entity: SessionAttendee = {
      id: crypto.randomUUID(),
      sessionId,
      userId,
      status,
      updatedAt: now,
    };
    this.attendees.set(entity.id, entity);
    return entity;
  }

  async listBySessionId(sessionId: string): Promise<SessionAttendeeWithUser[]> {
    return Array.from(this.attendees.values())
      .filter(a => a.sessionId === sessionId)
      .map(a => ({
        ...a,
        fullName: this.userNames.get(a.userId) ?? null,
        avatarUrl: null,
      }));
  }

  async getBySessionAndUser(sessionId: string, userId: string): Promise<SessionAttendee | null> {
    return Array.from(this.attendees.values()).find(
      a => a.sessionId === sessionId && a.userId === userId,
    ) ?? null;
  }

  async createPendingForMember(sessionId: string, userId: string): Promise<SessionAttendee> {
    return this.upsert(sessionId, userId, "pending");
  }
}
