import type { StudySession } from "../../domain/entities/StudySession.js";
import type { IStudySessionRepository } from "../../domain/repositories/IStudySessionRepository.js";
import type { ISubject } from "../../domain/events/observers/ISubject.js";
import type { IMemberRepository } from "../../domain/repositories/IMemberRepository.js";

export interface CreateSeriesInput {
  readonly actorUserId: string;
  readonly groupId: string;
  readonly title: string;
  readonly description: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly rrule?: string;
  readonly weekCount: number;
}

export class CreateStudySessionSeries {
  constructor(
    private readonly repository: IStudySessionRepository,
    private readonly memberRepository: IMemberRepository,
    private readonly subject?: ISubject,
  ) {}

  async execute(input: CreateSeriesInput): Promise<StudySession[]> {
    const title = input.title.trim();
    if (!title) throw new Error("Title is required");
    if (!input.groupId) throw new Error("Group ID is required");

    const startDate = new Date(input.startTime);
    if (isNaN(startDate.getTime())) throw new Error("Invalid startTime date");

    const endDate = new Date(input.endTime);
    if (isNaN(endDate.getTime())) throw new Error("Invalid endTime date");

    if (endDate <= startDate) throw new Error("End time must be after start time");

    const now = new Date();
    if (startDate <= now) throw new Error("Start time must be in the future");

    const sessions: StudySession[] = [];
    const weekCount = Math.min(input.weekCount || 8, 52);

    const series = await this.repository.create({
      groupId: input.groupId,
      title,
      description: input.description,
      startTime: input.startTime,
      endTime: input.endTime,
      rrule: input.rrule,
      parentSeriesId: undefined,
      createdBy: input.actorUserId,
    });
    sessions.push(series);

    if (input.rrule) {
      const durationMs = endDate.getTime() - startDate.getTime();
      for (let i = 1; i < weekCount; i++) {
        const weekStart = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + durationMs);
        const child = await this.repository.create({
          groupId: input.groupId,
          title,
          description: input.description,
          startTime: weekStart.toISOString(),
          endTime: weekEnd.toISOString(),
          rrule: undefined,
          parentSeriesId: series.id,
          createdBy: input.actorUserId,
        });
        sessions.push(child);
      }
    }

    if (this.subject) {
      for (const session of sessions) {
        await this.subject.emit({
          type: "SESSION_CREATED",
          version: "1.0",
          timestamp: new Date(),
          sessionId: session.id,
          groupId: session.groupId,
          title: session.title,
          startTime: session.startTime,
          endTime: session.endTime,
          createdBy: session.createdBy,
          isRecurring: !!input.rrule,
          seriesId: session.parentSeriesId,
        });
      }
    }

    return sessions;
  }
}
