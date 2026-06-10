import type { Event } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";
import type { INotificationRepository } from "../../domain/repositories/INotificationRepository.js";
import type { ISubscriptionRepository } from "../../domain/events/subscriptions/ISubscriptionRepository.js";
import type { IEventSocketGateway } from "../../domain/events/UniversityEventObserver.js";
import { EventContext } from "../../domain/state/EventContext.js";
import { NotFoundError } from "../../../../../shared/libs/errors/NotFoundError.js";

export interface PublishEventInput {
  readonly actorUserId: string;
  readonly eventId: string;
  readonly isAdmin: boolean;
}

export class PublishEvent {
  constructor(
    private readonly repository: IEventRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly notificationRepository: INotificationRepository | null,
    private readonly socketGateway: IEventSocketGateway | null,
  ) {}

  async execute(input: PublishEventInput): Promise<Event> {
    const event = await this.repository.getById(input.eventId);
    if (!event) {
      throw new NotFoundError("Evento no encontrado.");
    }

    const isOwner = event.organizerId === input.actorUserId;
    if (!isOwner && !input.isAdmin) {
      throw new Error("Solo el organizador o un administrador pueden publicar el evento.");
    }

    const context = EventContext.fromStatus(event.status);
    const newContext = context.publish(
      new Date(event.startAt),
      event.maxCapacity,
    );

    // Persist notifications BEFORE updating event status to avoid a race
    // condition: if a postgres_changes trigger or Gateway broadcast fires
    // on the status change, the frontend's useEventsSync → fetchNotifications()
    // will already find committed rows in user_notifications.
    let subscribers = await this.subscriptionRepository.getSubscribersByCategory(event.category);
    if (subscribers.length === 0) {
      console.log("[PublishEvent] No category subscribers, falling back to all profiles");
      subscribers = await this.subscriptionRepository.getAllUserIds();
    }

    const payload = {
      eventId: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      location: event.location,
      startAt: event.startAt,
      organizerId: event.organizerId,
      organizerName: event.organizerName,
      imageUrl: event.imageUrl,
    };

    const notificationRepo = this.notificationRepository;
    const gateway = this.socketGateway;

    if (notificationRepo) {
      await Promise.all(
        subscribers.map(async (userId) => {
          try {
            await notificationRepo.create({
              userId,
              type: "NUEVO_EVENTO",
              title: `Nuevo evento: ${event.title}`,
              body: `Se ha publicado un nuevo evento en la categoría ${event.category}: ${event.title}`,
              payload,
            });
          } catch (err) {
            console.error(`[PublishEvent] Failed to persist notification for user ${userId}:`, err);
          }
        }),
      );
    }

    // Update event status (this may trigger downstream effects like Gateway broadcasts)
    await this.repository.updateStatus(input.eventId, newContext.getStatus());

    const updated = await this.repository.getById(input.eventId);
    if (!updated) {
      throw new NotFoundError("Evento no encontrado después de publicar.");
    }

    // Emit via gateway (best-effort real-time, after DB writes are committed)
    if (gateway) {
      await Promise.all(
        subscribers.map(async (userId) => {
          try {
            await gateway.emitToUser(userId, "NUEVO_EVENTO", payload as unknown as Record<string, unknown>);
          } catch (err) {
            console.error(`[PublishEvent] Failed to emit to user ${userId}:`, err);
          }
        }),
      );
    }

    return updated;
  }
}