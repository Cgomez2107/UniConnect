import type { Message } from "../../domain/entities/Message.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";

export class GetMessageById {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(messageId: string, actorUserId: string): Promise<Message | null> {
    if (!messageId.trim()) {
      throw new Error("messageId es obligatorio.");
    }

    if (!actorUserId.trim()) {
      throw new Error("Token de autenticacion requerido.");
    }

    return this.repository.getMessageById(messageId, actorUserId);
  }
}
