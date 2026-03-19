import type { Message } from "../../domain/entities/Message.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";

export class SendMessage {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(conversationId: string, senderId: string, content: string): Promise<Message> {
    if (!conversationId.trim()) {
      throw new Error("conversationId es obligatorio.");
    }

    if (!senderId.trim()) {
      throw new Error("Token de autenticacion requerido.");
    }

    if (!content.trim()) {
      throw new Error("content es obligatorio.");
    }

    if (content.length > 5000) {
      throw new Error("content excede el maximo de 5000 caracteres.");
    }

    return this.repository.createMessage({
      conversationId: conversationId.trim(),
      senderId: senderId.trim(),
      content: content.trim(),
    });
  }
}
