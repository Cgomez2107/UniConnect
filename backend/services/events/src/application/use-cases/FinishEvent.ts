import type { Event } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";
import { EventContext } from "../../domain/state/EventContext.js";
import { AuthorizationError } from "../../../../../shared/libs/errors/AuthorizationError.js";
import { NotFoundError } from "../../../../../shared/libs/errors/NotFoundError.js";

export interface FinishEventInput {
  readonly actorUserId: string;
  readonly eventId: string;
  readonly isAdmin: boolean;
}

export class FinishEvent {
  constructor(private readonly repository: IEventRepository) {}

  async execute(input: FinishEventInput): Promise<Event> {
    const event = await this.repository.getById(input.eventId);
    if (!event) {
      throw new NotFoundError("Evento no encontrado.");
    }

    const isOwner = event.organizerId === input.actorUserId;
    if (!isOwner && !input.isAdmin) {
      throw new AuthorizationError(
        "Solo el organizador o un administrador pueden finalizar el evento.",
      );
    }

    const context = EventContext.fromStatus(event.status);
    const newContext = context.finish();

    await this.repository.updateStatus(input.eventId, newContext.getStatus());

    const updated = await this.repository.getById(input.eventId);
    if (!updated) {
      throw new NotFoundError("Evento no encontrado después de finalizar.");
    }

    return updated;
  }
}
