import type { IObserver } from "./IObserver.js";
import type { UniversityEvent } from "./UniversityEvents.js";
import type { IEventSocketGateway } from "./UniversityEventObserver.js";
import type { INotificationRepository } from "../repositories/INotificationRepository.js";

export interface IRegisteredUserRepository {
  getRegisteredUsers(eventId: string): Promise<string[]>;
}

export class CancellationObserver implements IObserver {
  readonly name = "CancellationObserver";

  constructor(
    private readonly registeredUserRepo: IRegisteredUserRepository,
    private readonly notificationRepository: INotificationRepository | null,
    private readonly socketGateway: IEventSocketGateway | null,
  ) {}

  async handle(event: UniversityEvent): Promise<void> {
    if (event.type !== "EVENT_CANCELLED") return;

    const userIds = await this.registeredUserRepo.getRegisteredUsers(event.eventId);

    const promises = userIds.map(async (userId) => {
      // Persist to DB first (safe fallback if WS is down)
      if (this.notificationRepository) {
        try {
          await this.notificationRepository.create({
            userId,
            type: "EVENT_CANCELLED",
            title: `Evento cancelado: ${event.title}`,
            body: `El evento "${event.title}" ha sido cancelado.`,
            payload: {
              eventId: event.eventId,
              title: event.title,
            },
          });
        } catch (err) {
          console.error(`[CancellationObserver] Failed to persist notification for user ${userId}:`, err);
        }
      }

      // Then emit via gateway
      const gateway = this.socketGateway;
      if (gateway) {
        try {
          await gateway.emitToUser(userId, "evento_cancelado", {
            eventId: event.eventId,
            title: event.title,
            message: `El evento "${event.title}" ha sido cancelado.`,
          });
        } catch (err) {
          console.error(`[CancellationObserver] Failed to notify user ${userId}:`, err);
        }
      }
    });

    await Promise.all(promises);
  }
}
