import type { IStudySessionRepository } from "../../domain/repositories/IStudySessionRepository.js";
import type { IMemberRepository } from "../../domain/repositories/IMemberRepository.js";
import type { NotificationService } from "../../../../../shared/patterns/strategy/NotificationService.js";

export class StudySessionReminderJob {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly CHECK_INTERVAL_MS = 5 * 60 * 1000;
  private readonly REMINDER_WINDOW_MINUTES = 30;

  constructor(
    private readonly repository: IStudySessionRepository,
    private readonly memberRepository: IMemberRepository,
    private readonly notificationService: NotificationService,
  ) {}

  start(): void {
    if (this.intervalId) return;
    console.log(
      JSON.stringify({
        service: "study-groups",
        level: "info",
        message: "StudySessionReminderJob started",
        checkIntervalMs: this.CHECK_INTERVAL_MS,
        reminderWindowMinutes: this.REMINDER_WINDOW_MINUTES,
      }),
    );
    this.tick();
    this.intervalId = setInterval(() => this.tick(), this.CHECK_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async tick(): Promise<void> {
    try {
      const sessions = await this.repository.findUpcomingWithoutReminder(
        this.REMINDER_WINDOW_MINUTES,
      );

      if (sessions.length === 0) return;

      console.log(
        JSON.stringify({
          service: "study-groups",
          level: "info",
          message: "StudySessionReminderJob: sessions to remind",
          count: sessions.length,
        }),
      );

      for (const session of sessions) {
        try {
          const members = await this.memberRepository.findByGroup(session.groupId);
          const promises = members.map(member =>
            this.notificationService.notificar({
              userId: member.userId,
              type: "studySessionReminder",
              title: "Recordatorio: Sesión de estudio",
              body: `"${session.title}" comienza en menos de ${this.REMINDER_WINDOW_MINUTES} minutos`,
              payload: {
                sessionId: session.id,
                groupId: session.groupId,
                title: session.title,
                startTime: session.startTime,
                endTime: session.endTime,
              },
              priority: "normal",
            }),
          );
          await Promise.allSettled(promises);
          await this.repository.markReminderSent(session.id);
        } catch (err) {
          console.error(
            JSON.stringify({
              service: "study-groups",
              level: "error",
              message: "StudySessionReminderJob: failed to process session",
              sessionId: session.id,
              error: (err as Error).message,
            }),
          );
        }
      }
    } catch (err) {
      console.error(
        JSON.stringify({
          service: "study-groups",
          level: "error",
          message: "StudySessionReminderJob: tick failed",
          error: (err as Error).message,
        }),
      );
    }
  }
}
