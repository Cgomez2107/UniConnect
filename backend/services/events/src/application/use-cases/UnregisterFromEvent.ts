import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";
import { ValidationError, NotFoundError } from "../../../../../shared/libs/errors/index.js";

interface UnregisterFromEventInput {
  eventId: string;
  userId: string;
}

export class UnregisterFromEvent {
  constructor(private readonly repository: IEventRepository) {}

  async execute(input: UnregisterFromEventInput): Promise<void> {
    const { eventId, userId } = input;

    const event = await this.repository.getById(eventId);
    if (!event) {
      throw new NotFoundError("Event not found");
    }

    // Criterio 4: cancelar con menos de 24 horas de anticipación
    const eventDate = new Date(event.startAt);
    const now = new Date();
    const diffMs = eventDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      throw new ValidationError(
        "Política de cancelación: No se permiten cancelaciones a menos de 24 horas del evento. Contacta al organizador directamente."
      );
    }

    await this.repository.unregisterFromEvent(eventId, userId);
  }
}
