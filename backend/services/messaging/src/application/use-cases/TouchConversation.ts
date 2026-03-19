import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";

export class TouchConversation {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(conversationId: string, actorUserId: string): Promise<void> {
    if (!conversationId.trim()) {
      throw new Error("conversationId es obligatorio.");
    }

    if (!actorUserId.trim()) {
      throw new Error("Token de autenticacion requerido.");
    }

    await this.repository.touchConversation(conversationId, actorUserId);
  }
}
