import type { StudySession } from "../entities/StudySession.js";

export interface ListSessionsFilters {
  from?: string;
  to?: string;
  status?: string;
}

export interface CreateStudySessionInput {
  seriesId: string | null;
  requestId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location: string | null;
  remindAt: string | null;
  createdBy: string;
}

export interface IStudySessionRepository {
  create(input: CreateStudySessionInput): Promise<StudySession>;
  createMany(inputs: CreateStudySessionInput[]): Promise<StudySession[]>;
  getById(id: string): Promise<StudySession | null>;
  listByRequestId(requestId: string, filters?: ListSessionsFilters): Promise<StudySession[]>;
  cancel(id: string): Promise<StudySession>;
  findPendingReminders(): Promise<StudySession[]>;
  markReminded(id: string): Promise<void>;
  listAttendeeUserIds(sessionId: string): Promise<string[]>;
  isGroupMember(requestId: string, userId: string): Promise<boolean>;
}
