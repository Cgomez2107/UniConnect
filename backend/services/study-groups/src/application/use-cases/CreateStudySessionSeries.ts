import type { StudySession } from "../../domain/entities/StudySession.js";
import type { IStudySessionRepository } from "../../domain/repositories/IStudySessionRepository.js";
import type { ISubject } from "../../domain/events/observers/ISubject.js";
import type { IMemberRepository } from "../../domain/repositories/IMemberRepository.js";

export interface CreateSeriesInput {
  readonly actorUserId: string;
  readonly requestId: string;
  readonly title: string;
  readonly description: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly rrule?: string;
  readonly weekCount: number;
  readonly remindAt?: string;
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
    if (!input.requestId) throw new Error("Request ID is required");

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
      seriesId: null,
      requestId: input.requestId,
      title,
      description: input.description,
      startTime: input.startTime,
      endTime: input.endTime,
      location: null,
      remindAt: input.remindAt || null,
      createdBy: input.actorUserId,
    });
    sessions.push(series);

    if (input.rrule) {
      const durationMs = endDate.getTime() - startDate.getTime();
      for (let i = 1; i < weekCount; i++) {
        const weekStart = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + durationMs);
        const childRemindAt = input.remindAt
          ? new Date(weekStart.getTime() - (startDate.getTime() - new Date(input.remindAt).getTime())).toISOString()
          : null;
        const child = await this.repository.create({
          seriesId: series.id,
          requestId: input.requestId,
          title,
          description: input.description,
          startTime: weekStart.toISOString(),
          endTime: weekEnd.toISOString(),
          location: null,
          remindAt: childRemindAt,
          createdBy: input.actorUserId,
        });
        sessions.push(child);
      }
    }

    if (this.subject) {
      // Emit notifications asynchronously (fire and forget) to not block session creation
      Promise.all(
        sessions.map(session =>
          this.subject!.emit({
            type: "SESSION_CREATED",
            version: "1.0",
            timestamp: new Date(),
            sessionId: session.id,
            groupId: session.requestId,
            title: session.title,
            startTime: session.startTime,
            endTime: session.endTime,
            createdBy: session.createdBy,
            isRecurring: !!input.rrule,
            seriesId: session.seriesId,
          }),
        ),
      ).catch(err => console.error("Failed to emit session created event:", err));
    }

    return sessions;
  }
}
