import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import type { ChatSubject } from "../../domain/events/ChatSubject.js";
import type { PollClosedEvent } from "../../domain/events/ChatEvents.js";
import { createGroupChannel } from "../../domain/events/ChatEvents.js";

export class PollSchedulerService {
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly POLLING_INTERVAL_MS = 60_000;

  constructor(
    private readonly repository: IMessagingRepository,
    private readonly chatSubject: ChatSubject,
  ) {}

  start(): void {
    if (this.timer) {
      console.warn("[PollScheduler] Scheduler ya está corriendo.");
      return;
    }

    console.log(`[PollScheduler] Iniciando scheduler cada ${this.POLLING_INTERVAL_MS / 1000}s`);
    this.timer = setInterval(() => {
      this.tick().catch((error) => {
        console.error("[PollScheduler] Error en tick:", error);
      });
    }, this.POLLING_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log("[PollScheduler] Scheduler detenido.");
    }
  }

  async tick(): Promise<void> {
    const closedIds = await this.repository.closeExpiredPolls();

    if (closedIds.length === 0) return;

    console.log(`[PollScheduler] Cerradas ${closedIds.length} encuesta(s): ${closedIds.join(", ")}`);

    await Promise.all(closedIds.map(async (pollId) => {
      try {
        const results = await this.repository.getPollResults(pollId);
        const groupId = await this.repository.getPollGroupId(pollId);
        const channel = createGroupChannel(groupId);

        const event: PollClosedEvent = {
          type: "POLL_CLOSED",
          version: "1.0",
          timestamp: new Date(),
          pollId,
          groupId,
          status: "closed",
          finalResults: results.results,
          totalVotes: results.totalVotes,
        };

        await this.chatSubject.emit(channel, event);
        console.log(`[PollScheduler] Evento POLL_CLOSED emitido para encuesta ${pollId}`);
      } catch (error) {
        console.error(`[PollScheduler] Error procesando encuesta ${pollId}:`, error);
      }
    }));
  }
}
