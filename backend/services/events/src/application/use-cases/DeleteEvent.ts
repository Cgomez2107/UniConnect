import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";

/**
 * Caso de uso: eliminar evento
 * Solo el organizador puede eliminar
 */
export class DeleteEvent {
  constructor(private readonly repository: IEventRepository) {}

  async execute(input: { eventId: string; actorUserId: string }): Promise<void> {
    if (!input.eventId.trim()) {
      throw new Error("Event ID is required");
    }

    await this.repository.delete(input.eventId.trim(), input.actorUserId);
  }
}
