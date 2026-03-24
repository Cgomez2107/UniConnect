import type { Event } from "../../domain/entities/Event.js";
import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";

/**
 * Caso de uso: obtener lista de todos los eventos
 * Visible para cualquier usuario
 */
export class GetAllEvents {
  constructor(private readonly repository: IEventRepository) {}

  async execute(): Promise<Event[]> {
    return this.repository.getAllEvents();
  }
}
