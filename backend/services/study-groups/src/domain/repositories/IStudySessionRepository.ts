import type { StudySession, CreateSessionInput } from "../entities/StudySession.js";

export interface IStudySessionRepository {
  findById(id: string): Promise<StudySession | null>;
  findByGroup(groupId: string, from?: string, to?: string): Promise<StudySession[]>;
  findBySeries(parentSeriesId: string): Promise<StudySession[]>;
  findUpcomingWithoutReminder(withinMinutes: number): Promise<StudySession[]>;
  create(data: CreateSessionInput): Promise<StudySession>;
  cancel(id: string, userId: string): Promise<StudySession>;
  markReminderSent(id: string): Promise<void>;
}
