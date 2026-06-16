import type { Event } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";
import type { ISubject } from "../../domain/events/ISubject.js";
import { EventContext } from "../../domain/state/EventContext.js";
import { AuthorizationError } from "../../../../../shared/libs/errors/AuthorizationError.js";
import { NotFoundError } from "../../../../../shared/libs/errors/NotFoundError.js";

export interface CancelEventInput {
  readonly actorUserId: string;
  readonly eventId: string;
  readonly isAdmin: boolean;
}

export class CancelEvent {
  constructor(
    private readonly repository: IEventRepository,
    private readonly subject?: ISubject,
  ) {}

  async execute(input: CancelEventInput): Promise<Event> {
    const event = await this.repository.getById(input.eventId);
    if (!event) {
      throw new NotFoundError("Evento no encontrado.");
    }

    const isOwner = event.organizerId === input.actorUserId;
    if (!isOwner && !input.isAdmin) {
      throw new AuthorizationError(
        "Solo el organizador o un administrador pueden cancelar el evento.",
      );
    }

    const context = EventContext.fromStatus(event.status);
    const newContext = context.cancel();

    await this.repository.updateStatus(input.eventId, newContext.getStatus());

    if (this.subject) {
      await this.subject.emit({
        type: "EVENT_CANCELLED" as const,
        version: "1.0",
        timestamp: new Date(),
        eventId: event.id,
        title: event.title,
        message: `El evento "${event.title}" ha sido cancelado.`,
        payload: {
          eventId: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          category: event.category,
          startAt: event.startAt,
          organizerId: event.organizerId,
        },
      });
    }

    const updated = await this.repository.getById(input.eventId);
    if (!updated) {
      throw new NotFoundError("Evento no encontrado después de cancelar.");
    }

    return updated;
  }
}
