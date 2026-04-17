import type { Event } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";

/**
 * Caso de uso: obtener eventos próximos
 * Útil para la pantalla principal/feed
 */
export class GetUpcomingEvents {
  constructor(private readonly repository: IEventRepository) {}

  async execute(limit?: number): Promise<Event[]> {
    return this.repository.getUpcomingEvents(limit);
  }
}
