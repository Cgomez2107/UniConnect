import type { IEventSocketGateway } from "../../domain/events/UniversityEventObserver.js";

export class ConsoleEventGateway implements IEventSocketGateway {
  async emitToUser(userId: string, event: string, payload: Record<string, unknown>): Promise<void> {
    console.log(
      JSON.stringify({
        service: "events",
        level: "info",
        message: "[WS] Emitir evento a usuario",
        event,
        userId,
        payload,
      }),
    );
  }
}
