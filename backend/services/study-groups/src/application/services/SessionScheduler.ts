import type { IStudySessionRepository } from "../../domain/repositories/IStudySessionRepository.js";
import type { NotificationService } from "../../../../../shared/patterns/strategy/NotificationService.js";

const POLL_INTERVAL_MS = 30_000;

export class SessionScheduler {
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    private readonly sessionRepository: IStudySessionRepository,
    private readonly notificationService: NotificationService,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;

    this.intervalHandle = setInterval(() => {
      this.processReminders().catch(err => {
        console.error("[SessionScheduler] Error processing reminders:", err);
      });
    }, POLL_INTERVAL_MS);

    this.processReminders().catch(err => {
      console.error("[SessionScheduler] Initial reminder processing error:", err);
    });
  }

  stop(): void {
    this.running = false;
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  private async processReminders(): Promise<void> {
    const sessions = await this.sessionRepository.findPendingReminders();

    for (const session of sessions) {
      try {
        const userIds = await this.sessionRepository.listAttendeeUserIds(session.id);

        for (const userId of userIds) {
          const nowMs = Date.now();
          const startMs = new Date(session.startTime).getTime();
          const minutesLeft = Math.max(0, Math.round((startMs - nowMs) / 60000));

          await this.notificationService.notificar({
            userId,
            type: "recordatorio_sesion",
            title: session.title || "Recordatorio de sesion",
            body: `Tu sesion de estudio comienza en ${minutesLeft} minutos (${new Date(session.startTime).toLocaleTimeString()}).`,
            payload: {
              sessionId: session.id,
              requestId: session.requestId,
              startTime: session.startTime,
            },
            priority: "normal",
          });
        }

        await this.sessionRepository.markReminded(session.id);
      } catch (err) {
        console.error(`[SessionScheduler] Failed to process session ${session.id}:`, err);
      }
    }
  }
}
