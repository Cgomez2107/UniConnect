import { randomUUID } from "node:crypto";
import type { StudySession, CreateSessionInput } from "../../domain/entities/StudySession.js";
import type { IStudySessionRepository } from "../../domain/repositories/IStudySessionRepository.js";

export class InMemoryStudySessionRepository implements IStudySessionRepository {
  private sessions: Map<string, StudySession> = new Map();

  async findById(id: string): Promise<StudySession | null> {
    return this.sessions.get(id) ?? null;
  }

  async findByGroup(groupId: string, from?: string, to?: string): Promise<StudySession[]> {
    let results = Array.from(this.sessions.values()).filter(s => s.groupId === groupId);
    if (from) {
      results = results.filter(s => s.startTime >= from);
    }
    if (to) {
      results = results.filter(s => s.startTime <= to);
    }
    return results.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async findBySeries(parentSeriesId: string): Promise<StudySession[]> {
    return Array.from(this.sessions.values())
      .filter(s => s.parentSeriesId === parentSeriesId)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async findUpcomingWithoutReminder(withinMinutes: number): Promise<StudySession[]> {
    const now = new Date();
    const deadline = new Date(now.getTime() + withinMinutes * 60_000);
    return Array.from(this.sessions.values()).filter(s => {
      if (s.cancelledAt) return false;
      if (s.reminderSentAt) return false;
      const start = new Date(s.startTime);
      return start > now && start <= deadline;
    });
  }

  async create(data: CreateSessionInput): Promise<StudySession> {
    const now = new Date().toISOString();
    const session: StudySession = {
      id: randomUUID(),
      groupId: data.groupId,
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      rrule: data.rrule ?? null,
      parentSeriesId: data.parentSeriesId ?? null,
      createdBy: data.createdBy,
      cancelledAt: null,
      reminderSentAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async cancel(id: string, _userId: string): Promise<StudySession> {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error("Study session not found");
    }
    if (session.cancelledAt) {
      throw new Error("Study session is already cancelled");
    }
    const updated: StudySession = {
      ...session,
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.sessions.set(id, updated);
    return updated;
  }

  async markReminderSent(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (!session) return;
    this.sessions.set(id, {
      ...session,
      reminderSentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
