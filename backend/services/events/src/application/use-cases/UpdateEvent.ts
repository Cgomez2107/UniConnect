import type { Event } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";

export interface UpdateEventInput {
  readonly actorUserId: string;
  readonly eventId: string;
  readonly title?: string;
  readonly description?: string;
  readonly location?: string;
  readonly startAt?: string;
  readonly endAt?: string;
  readonly maxCapacity?: number | null;
}

/**
 * Caso de uso: actualizar evento
 * Solo el organizador (propietario) puede actualizar
 */
export class UpdateEvent {
  constructor(private readonly repository: IEventRepository) {}

  async execute(input: UpdateEventInput): Promise<Event> {
    if (!input.eventId.trim()) {
      throw new Error("Event ID is required");
    }

    const updatePayload: Record<string, unknown> = {};

    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title) throw new Error("Title cannot be empty");
      updatePayload.title = title;
    }

    if (input.description !== undefined) {
      const description = input.description.trim();
      if (!description) throw new Error("Description cannot be empty");
      updatePayload.description = description;
    }

    if (input.location !== undefined) {
      const location = input.location.trim();
      if (!location) throw new Error("Location cannot be empty");
      updatePayload.location = location;
    }

    if (input.startAt !== undefined) {
      const startDate = new Date(input.startAt);
      if (isNaN(startDate.getTime())) throw new Error("Invalid startAt date");
      updatePayload.startAt = input.startAt;
    }

    if (input.endAt !== undefined) {
      const endDate = new Date(input.endAt);
      if (isNaN(endDate.getTime())) throw new Error("Invalid endAt date");
      updatePayload.endAt = input.endAt;
    }

    if (input.maxCapacity !== undefined) {
      if (input.maxCapacity && input.maxCapacity < 1) {
        throw new Error("Max capacity must be at least 1");
      }
      updatePayload.maxCapacity = input.maxCapacity;
    }

    return this.repository.update(input.eventId.trim(), input.actorUserId, updatePayload);
  }
}
