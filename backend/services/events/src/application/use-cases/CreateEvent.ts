import type { Event } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";

export interface CreateEventInput {
  readonly actorUserId: string;
  readonly title: string;
  readonly description: string;
  readonly location: string;
  readonly startAt: string;
  readonly endAt?: string;
  readonly category?: string;
  readonly imageUrl?: string;
  readonly maxCapacity?: number;
}

/**
 * Caso de uso: crear evento
 * Solo admins pueden crear eventos.
 * La tabla `events` de Supabase usa event_date (no start_at/end_at).
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

    if (!location) {
      throw new Error("Location is required");
    }

    const startDate = new Date(input.startAt);
    if (isNaN(startDate.getTime())) {
      throw new Error("Invalid startAt date");
    }

    return this.repository.create({
      title,
      description,
      location,
      startAt: input.startAt,
      endAt: input.endAt,
      organizerId: input.actorUserId,
      category: input.category,
      imageUrl: input.imageUrl,
      maxCapacity: input.maxCapacity,
    });
  }
}
