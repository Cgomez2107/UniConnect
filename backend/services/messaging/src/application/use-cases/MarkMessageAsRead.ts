import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";

export class MarkMessageAsRead {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(messageId: string, actorUserId: string): Promise<boolean> {
    if (!messageId.trim()) {
      throw new Error("messageId es obligatorio.");
    }

    if (!actorUserId.trim()) {
      throw new Error("Token de autenticacion requerido.");
    }

    return this.repository.markMessageAsRead(messageId, actorUserId);
  }
}
