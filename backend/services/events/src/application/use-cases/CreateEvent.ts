import type { Event } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";
import type { ISubject } from "../../domain/events/ISubject.js";
import { ValidationError } from "../../../../../shared/libs/errors/ValidationError.js";
import type { EventCategory } from "../../domain/entities/Event.js";

export interface CreateEventInput {
  readonly actorUserId: string;
  readonly title: string;
  readonly description: string;
  readonly location: string;
  readonly startAt: string;
  readonly endAt?: string;
  readonly category: EventCategory;
  readonly imageUrl?: string;
  readonly maxCapacity?: number;
}

export class CreateEvent {
  constructor(
    private readonly repository: IEventRepository,
    private readonly subject?: ISubject,
  ) {}

  async execute(input: CreateEventInput): Promise<Event> {
    const title = input.title.trim();
    const description = input.description.trim();
    if (!title) {
      throw new Error("Title is required");
    }

    const location = (input.location || "").trim();

    const startDate = new Date(input.startAt);
    if (isNaN(startDate.getTime())) {
      throw new Error("Invalid startAt date");
    }

    if (!input.category) {
      throw new ValidationError("Category is required");
    }

    const validCategories: EventCategory[] = ["academico", "cultural", "deportivo", "otro"];
    if (!validCategories.includes(input.category)) {
      throw new ValidationError("Invalid category");
    }

    const event = await this.repository.create({
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

    if (this.subject) {
      const category = input.category;
      await this.subject.emit({
        type: "NUEVO_EVENTO",
        version: "1.0",
        timestamp: new Date(),
        eventId: event.id,
        title: event.title,
        category,
        message: `Se ha publicado un nuevo evento: ${event.title}`,
        payload: {
          eventId: event.id,
          title: event.title,
          description: event.description,
          category,
          location: event.location,
          startAt: event.startAt,
          organizerId: event.organizerId,
          organizerName: event.organizerName,
          imageUrl: event.imageUrl,
        },
      });
    }

    return event;
  }
}
