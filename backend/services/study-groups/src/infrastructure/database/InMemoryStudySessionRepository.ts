import { randomUUID } from "node:crypto";
import type { StudySession } from "../../domain/entities/StudySession.js";
import type { IStudySessionRepository, ListSessionsFilters, CreateStudySessionInput } from "../../domain/repositories/IStudySessionRepository.js";

export class InMemoryStudySessionRepository implements IStudySessionRepository {
  private sessions: Map<string, StudySession> = new Map();
  private attendeeUserIds: Map<string, string[]> = new Map();
  private groupMembers: Map<string, string[]> = new Map();

  async create(input: CreateStudySessionInput): Promise<StudySession> {
    const now = new Date().toISOString();
    const entity: StudySession = {
      id: randomUUID(),
      seriesId: input.seriesId,
      requestId: input.requestId,
      title: input.title,
      description: input.description,
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location,
      status: "scheduled",
      remindAt: input.remindAt,
      reminded: false,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(entity.id, entity);
    return entity;
  }

  async createMany(inputs: CreateStudySessionInput[]): Promise<StudySession[]> {
    const results: StudySession[] = [];
    for (const input of inputs) {
      results.push(await this.create(input));
    }
    return results;
  }

  async getById(id: string): Promise<StudySession | null> {
    return this.sessions.get(id) ?? null;
  }

  async listByRequestId(requestId: string, filters?: ListSessionsFilters): Promise<StudySession[]> {
    let results = Array.from(this.sessions.values()).filter(s => s.requestId === requestId);

    if (filters?.from) {
      const from = filters.from;
      results = results.filter(s => s.startTime >= from);
    }
    if (filters?.to) {
      const to = filters.to;
      results = results.filter(s => s.startTime <= to);
    }
    if (filters?.status) {
      results = results.filter(s => s.status === filters.status);
    }

    return results.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async cancel(id: string): Promise<StudySession> {
    const session = this.sessions.get(id);
    if (!session) throw new Error("Session not found");
    const updated: StudySession = { ...session, status: "cancelled", updatedAt: new Date().toISOString() };
    this.sessions.set(id, updated);
    return updated;
  }

  async findPendingReminders(): Promise<StudySession[]> {
    const now = new Date();
    return Array.from(this.sessions.values()).filter(s =>
      s.status === "scheduled" &&
      !s.reminded &&
      s.remindAt !== null &&
      new Date(s.remindAt) <= now
    );
  }

  async markReminded(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      this.sessions.set(id, { ...session, reminded: true, updatedAt: new Date().toISOString() });
    }
  }

  async listAttendeeUserIds(sessionId: string): Promise<string[]> {
    return this.attendeeUserIds.get(sessionId) ?? [];
  }

  async isGroupMember(requestId: string, userId: string): Promise<boolean> {
    return this.groupMembers.get(requestId)?.includes(userId) ?? false;
  }

  setAttendeeUserIds(sessionId: string, userIds: string[]): void {
    this.attendeeUserIds.set(sessionId, userIds);
  }

  setGroupMembers(requestId: string, userIds: string[]): void {
    this.groupMembers.set(requestId, userIds);
  }
}
