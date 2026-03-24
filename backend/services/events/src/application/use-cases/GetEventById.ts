import type { Event } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";

/**
 * Caso de uso: obtener detalle de un evento
 */
export class GetEventById {
  constructor(private readonly repository: IEventRepository) {}

  async execute(eventId: string): Promise<Event | null> {
    if (!eventId.trim()) {
      throw new Error("Event ID is required");
    }

    return this.repository.getById(eventId.trim());
  }
}
