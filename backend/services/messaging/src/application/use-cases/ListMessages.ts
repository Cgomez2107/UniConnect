import type { Message } from "../../domain/entities/Message.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";

export class ListMessages {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(
    conversationId: string,
    actorUserId: string,
    limit = 50,
    offset = 0,
  ): Promise<Message[]> {
    if (!conversationId.trim()) {
      throw new Error("conversationId es obligatorio.");
    }

    if (!actorUserId.trim()) {
      throw new Error("Token de autenticacion requerido.");
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error("limit debe estar entre 1 y 100.");
    }

    if (!Number.isInteger(offset) || offset < 0) {
      throw new Error("offset no puede ser negativo.");
    }

    return this.repository.listMessages(conversationId, actorUserId, limit, offset);
  }
}
