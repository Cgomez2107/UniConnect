export class PollTimerService {
  private readonly timers = new Map<string, NodeJS.Timeout>();

  schedule(
    messageId: string,
    closesAt: Date,
    onClose: (messageId: string) => Promise<void>,
  ): void {
    this.cancel(messageId);

    const delay = closesAt.getTime() - Date.now();
    if (delay <= 0) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        await onClose(messageId);
      } catch (error) {
        console.error(
          `[PollTimerService] Error closing poll ${messageId}:`,
          error,
        );
      } finally {
        this.timers.delete(messageId);
      }
    }, delay);

    this.timers.set(messageId, timer);
  }

  cancel(messageId: string): void {
    const existing = this.timers.get(messageId);
    if (existing) {
      clearTimeout(existing);
      this.timers.delete(messageId);
    }
  }

  clearAll(): void {
    for (const [messageId, timer] of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}
