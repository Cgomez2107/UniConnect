import type { Message } from "../../domain/entities/Message.js";
import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";

export class ListMessages {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(
    conversationId: string,
    actorUserId: string,
    limit = 50,
    offset = 0,
  ): Promise<Message[]> {
    const normalizedConversationId = requireTrimmed(conversationId, "conversationId");
    const normalizedActorUserId = requireTrimmed(actorUserId, "actorUserId");

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error("limit debe estar entre 1 y 100.");
    }

    if (!Number.isInteger(offset) || offset < 0) {
      throw new Error("offset no puede ser negativo.");
    }

    return this.repository.listMessages(normalizedConversationId, normalizedActorUserId, limit, offset);
  }
}
