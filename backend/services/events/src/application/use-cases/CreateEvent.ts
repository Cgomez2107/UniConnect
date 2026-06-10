import type { Event } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";
import type { UniversityEventSubject } from "../../domain/events/UniversityEventSubject.js";
import { ValidationError } from "../../../../../shared/libs/errors/ValidationError.js";

export interface CreateEventInput {
  readonly actorUserId: string;
  readonly title: string;
  readonly description: string;
  readonly location: string;
  readonly startAt: string;
  readonly endAt?: string;
  readonly category: string;
  readonly imageUrl?: string;
  readonly maxCapacity?: number | null;
}

export class CreateEvent {
  constructor(
    private readonly repository: IEventRepository,
    private readonly eventSubject?: UniversityEventSubject,
  ) {}

  async execute(input: CreateEventInput): Promise<Event> {
    const title = input.title.trim();
    const description = input.description.trim();
    if (!title) {
      throw new ValidationError("El título es obligatorio.");
    }

    const location = (input.location || "").trim();

    const startDate = new Date(input.startAt);
    if (isNaN(startDate.getTime())) {
      throw new ValidationError("La fecha de inicio no es válida.");
    }

    if (startDate.getTime() <= Date.now()) {
      throw new ValidationError("La fecha del evento debe ser posterior a la fecha actual.");
    }

    if (input.maxCapacity !== null && input.maxCapacity !== undefined) {
      if (!Number.isFinite(input.maxCapacity) || input.maxCapacity <= 0) {
        throw new ValidationError("La capacidad máxima debe ser un número entero válido mayor a 0.");
      }
    }

    if (!input.category) {
      throw new ValidationError("La categoría es obligatoria.");
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
      maxCapacity: input.maxCapacity ?? null,
    });

    if (this.eventSubject) {
      await this.eventSubject.emit({
        type: "NUEVO_EVENTO",
        version: "1.0",
        timestamp: new Date(),
        eventId: event.id,
        title: event.title,
        category: event.category,
        message: `Nuevo evento: ${event.title}`,
        payload: {
          eventId: event.id,
          title: event.title,
          description: event.description,
          category: event.category,
          location: event.location,
          startAt: event.startAt,
          organizerId: input.actorUserId,
        },
      });
    }

    return event;
  }
}