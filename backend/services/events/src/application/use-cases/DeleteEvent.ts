import type { IEventRepository } from "../../domain/repositories/IEventRepository.js";
import { EventContext } from "../../domain/state/EventContext.js";
import { AuthorizationError } from "../../../../../shared/libs/errors/AuthorizationError.js";
import { NotFoundError } from "../../../../../shared/libs/errors/NotFoundError.js";

export class DeleteEvent {
  constructor(private readonly repository: IEventRepository) {}

  async execute(input: { eventId: string; isAdmin: boolean }): Promise<void> {
    if (!input.eventId.trim()) {
      throw new Error("Event ID is required");
    }

    const event = await this.repository.getById(input.eventId);
    if (!event) {
      throw new NotFoundError("Evento no encontrado.");
    }

    if (!input.isAdmin) {
      throw new AuthorizationError("Solo un administrador puede eliminar un evento.");
    }

    const context = EventContext.fromStatus(event.status);
    if (!context.canDelete()) {
      throw new Error(
        `No se puede eliminar un evento en estado '${event.status}'.`,
      );
    }

    await this.repository.softDelete(input.eventId.trim());
  }
}
