import type { Event } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";
import { EventContext } from "../../domain/state/EventContext.js";
import { NotFoundError } from "../../../../../shared/libs/errors/NotFoundError.js";
import { ValidationError } from "../../../../../shared/libs/errors/ValidationError.js";

export interface UpdateEventInput {
  readonly actorUserId: string;
  readonly eventId: string;
  readonly isAdmin?: boolean;
  readonly title?: string;
  readonly description?: string;
  readonly location?: string;
  readonly startAt?: string;
  readonly endAt?: string;
  readonly category?: string;
  readonly imageUrl?: string;
  readonly maxCapacity?: number | null;
}

export class UpdateEvent {
  constructor(private readonly repository: IEventRepository) {}

  async execute(input: UpdateEventInput): Promise<Event> {
    if (!input.eventId.trim()) {
      throw new ValidationError("El ID del evento es obligatorio.");
    }

    const existing = await this.repository.getById(input.eventId);
    if (!existing) {
      throw new NotFoundError("Evento no encontrado.");
    }

    if (existing.organizerId !== input.actorUserId && !input.isAdmin) {
      throw new Error("Solo el organizador o un administrador pueden editar este evento.");
    }

    const context = EventContext.fromStatus(existing.status);
    if (!context.canEdit()) {
      throw new Error(
        `No se puede editar un evento en estado '${existing.status}'. Solo se permite editar en estado 'draft'.`,
      );
    }

    const updatePayload: Record<string, unknown> = {};

    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title) throw new ValidationError("El título no puede estar vacío.");
      updatePayload.title = title;
    }

    if (input.description !== undefined) {
      const description = input.description.trim();
      if (!description) throw new ValidationError("La descripción no puede estar vacía.");
      updatePayload.description = description;
    }

    if (input.location !== undefined) {
      const location = input.location.trim();
      if (!location) throw new ValidationError("La ubicación no puede estar vacía.");
      updatePayload.location = location;
    }

    if (input.startAt !== undefined) {
      const startDate = new Date(input.startAt);
      if (isNaN(startDate.getTime())) throw new ValidationError("La fecha de inicio no es válida.");
      if (startDate.getTime() <= Date.now()) throw new ValidationError("La fecha del evento debe ser posterior a la fecha actual.");
      updatePayload.startAt = input.startAt;
    }

    if (input.endAt !== undefined) {
      const endDate = new Date(input.endAt);
      if (isNaN(endDate.getTime())) throw new ValidationError("La fecha de finalización no es válida.");
      updatePayload.endAt = input.endAt;
    }

    if (input.maxCapacity !== undefined) {
      if (input.maxCapacity !== null && input.maxCapacity <= 0) {
        throw new ValidationError("La capacidad máxima debe ser mayor a 0.");
      }
      updatePayload.maxCapacity = input.maxCapacity;
    }

    if (input.category !== undefined) {
      const cat = input.category.trim();
      if (!cat) throw new ValidationError("La categoría no puede estar vacía.");
      updatePayload.category = cat;
    }

    if (input.imageUrl !== undefined) {
      updatePayload.imageUrl = input.imageUrl;
    }

    return this.repository.update(input.eventId.trim(), input.actorUserId, updatePayload);
  }
}
