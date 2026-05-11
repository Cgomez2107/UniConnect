import type { IObserver } from "./IObserver.js";
import type { UniversityEvent } from "./UniversityEvents.js";
import type { ISubscriptionRepository } from "./subscriptions/ISubscriptionRepository.js";

export interface IEventSocketGateway {
  emitToUser(userId: string, event: string, payload: Record<string, unknown>): Promise<void>;
}

export class UniversityEventObserver implements IObserver {
  readonly name = "UniversityEventObserver";

  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly socketGateway: IEventSocketGateway,
  ) {}

  async handle(event: UniversityEvent): Promise<void> {
    if (event.type !== "NUEVO_EVENTO") return;

    const category = event.category;
    const subscribers = await this.subscriptionRepository.getSubscribersByCategory(category);

    const promises = subscribers.map(userId =>
      this.socketGateway.emitToUser(userId, "NUEVO_EVENTO", event.payload as unknown as Record<string, unknown>)
        .catch(err => {
          console.error(`[UniversityEventObserver] Failed to emit to user ${userId}:`, err);
        }),
    );
    await Promise.all(promises);
  }
}
