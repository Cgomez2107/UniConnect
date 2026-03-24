import type { Event } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";

export interface CreateEventInput {
  readonly actorUserId: string;
  readonly title: string;
  readonly description: string;
  readonly location: string;
  readonly startAt: string;
  readonly endAt: string;
  readonly maxCapacity?: number;
}

/**
 * Caso de uso: crear evento
 * Solo admins pueden crear eventos
 * Nota: validación de permisos ocurre en el middleware HTTP
 */
export class CreateEvent {
  constructor(private readonly repository: IEventRepository) {}

  async execute(input: CreateEventInput): Promise<Event> {
    const title = input.title.trim();
    const description = input.description.trim();
    const location = input.location.trim();

    if (!title) {
      throw new Error("Title is required");
    }

    if (!description) {
      throw new Error("Description is required");
    }

    if (!location) {
      throw new Error("Location is required");
    }

    const startDate = new Date(input.startAt);
    const endDate = new Date(input.endAt);

    if (isNaN(startDate.getTime())) {
      throw new Error("Invalid startAt date");
    }

    if (isNaN(endDate.getTime())) {
      throw new Error("Invalid endAt date");
    }

    if (endDate <= startDate) {
      throw new Error("End date must be after start date");
    }

    if (input.maxCapacity && input.maxCapacity < 1) {
      throw new Error("Max capacity must be at least 1");
    }

    return this.repository.create({
      title,
      description,
      location,
      startAt: input.startAt,
      endAt: input.endAt,
      organizerId: input.actorUserId,
      maxCapacity: input.maxCapacity,
    });
  }
}
