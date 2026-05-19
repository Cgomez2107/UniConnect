import type { StudySession } from "../../domain/entities/StudySession.js";
import type { SessionSeries } from "../../domain/entities/SessionSeries.js";
import type { IStudySessionRepository, CreateStudySessionInput } from "../../domain/repositories/IStudySessionRepository.js";
import type { ISessionSeriesRepository } from "../../domain/repositories/ISessionSeriesRepository.js";
import type { IStudyGroupRepository } from "../../domain/repositories/IStudyGroupRepository.js";
import { NotFoundError, AuthorizationError } from "../../../../../shared/libs/errors/index.js";

const MAX_WEEKS = 52;
const DEFAULT_WEEKS = 4;
const REMINDER_OFFSET_MINUTES = 30;

export interface CreateSingleSessionInput {
  readonly actorUserId: string;
  readonly requestId: string;
  readonly title?: string;
  readonly description?: string;
  readonly startTime: string;
  readonly durationMinutes: number;
  readonly location?: string;
}

export interface CreateRecurringSessionInput {
  readonly actorUserId: string;
  readonly requestId: string;
  readonly title?: string;
  readonly description?: string;
  readonly startDate: string;
  readonly endDate?: string;
  readonly time: string;
  readonly durationMinutes: number;
  readonly daysOfWeek: number[];
  readonly frequency: "weekly";
  readonly location?: string;
}

export type CreateSessionResult = {
  type: "single";
  session: StudySession;
} | {
  type: "recurring";
  series: SessionSeries;
  sessions: StudySession[];
  count: number;
};

export class CreateStudySession {
  constructor(
    private readonly sessionRepository: IStudySessionRepository,
    private readonly seriesRepository: ISessionSeriesRepository,
    private readonly studyGroupRepository: IStudyGroupRepository,
  ) {}

  private groupNameCache: string = "";

  async executeSingle(input: CreateSingleSessionInput): Promise<CreateSessionResult> {
    const groupName = await this.ensureAuthorized(input.actorUserId, input.requestId);

    const startTime = new Date(input.startTime);
    const endTime = new Date(startTime.getTime() + input.durationMinutes * 60_000);
    const remindAt = new Date(startTime.getTime() - REMINDER_OFFSET_MINUTES * 60_000);

    const session = await this.sessionRepository.create({
      seriesId: null,
      requestId: input.requestId,
      title: input.title ?? groupName,
      description: input.description,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      location: input.location ?? null,
      remindAt: remindAt.toISOString(),
      createdBy: input.actorUserId,
    });

    return { type: "single", session };
  }

  async executeRecurring(input: CreateRecurringSessionInput): Promise<CreateSessionResult> {
    const groupName = await this.ensureAuthorized(input.actorUserId, input.requestId);

    if (!input.daysOfWeek.every(d => Number.isInteger(d) && d >= 0 && d <= 6)) {
      throw new Error("daysOfWeek must contain integers between 0 (Sunday) and 6 (Saturday).");
    }

    if (input.daysOfWeek.length === 0) {
      throw new Error("daysOfWeek must not be empty.");
    }

    function parseUtcDate(dateStr: string): number {
      const [y, m, d] = dateStr.split("-").map(Number);
      return Date.UTC(y, m - 1, d);
    }
    const startMs = parseUtcDate(input.startDate);
    const msPerDay = 24 * 60 * 60 * 1000;
    const defaultEndMs = startMs + DEFAULT_WEEKS * 7 * msPerDay;
    const effectiveEndMs = input.endDate ? parseUtcDate(input.endDate) : defaultEndMs;
    const effectiveEndDate = new Date(effectiveEndMs);

    const maxEndMs = startMs + MAX_WEEKS * 7 * msPerDay;
    if (effectiveEndMs > maxEndMs) {
      throw new Error(`Recurrence range cannot exceed ${MAX_WEEKS} weeks from start date.`);
    }

    const [hours, minutes] = input.time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error("Invalid time format. Use HH:MM.");
    }

    const series = await this.seriesRepository.create({
      requestId: input.requestId,
      frequency: input.frequency,
      interval: 1,
      daysOfWeek: input.daysOfWeek,
      startDate: input.startDate,
      endDate: effectiveEndDate.toISOString().split("T")[0],
      startTime: input.time,
      durationMinutes: input.durationMinutes,
      location: input.location ?? null,
      createdBy: input.actorUserId,
    });

    const sessions: CreateStudySessionInput[] = [];
    const current = new Date(startMs);

    while (current.getTime() <= effectiveEndMs) {
      if (input.daysOfWeek.includes(current.getUTCDay())) {
        const sessionStart = new Date(
          Date.UTC(
            current.getUTCFullYear(),
            current.getUTCMonth(),
            current.getUTCDate(),
            hours,
            minutes,
          ),
        );
        const sessionEnd = new Date(sessionStart.getTime() + input.durationMinutes * 60_000);
        const remindAt = new Date(sessionStart.getTime() - REMINDER_OFFSET_MINUTES * 60_000);

        sessions.push({
          seriesId: series.id,
          requestId: input.requestId,
          title: input.title ?? groupName,
          description: input.description,
          startTime: sessionStart.toISOString(),
          endTime: sessionEnd.toISOString(),
          location: input.location ?? null,
          remindAt: remindAt.toISOString(),
          createdBy: input.actorUserId,
        });
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    const createdSessions = await this.sessionRepository.createMany(sessions);

    return {
      type: "recurring",
      series,
      sessions: createdSessions,
      count: createdSessions.length,
    };
  }

  private async ensureAuthorized(actorUserId: string, requestId: string): Promise<string> {
    const group = await this.studyGroupRepository.loadStudyGroup(requestId, {
      subscribe: () => {},
      unsubscribe: () => {},
      emit: async () => {},
    });

    if (!group) {
      throw new NotFoundError("Study group not found.");
    }

    if (group.adminId !== actorUserId) {
      throw new AuthorizationError("Only the group author or an admin can create sessions.");
    }

    return group.groupName;
  }
}
