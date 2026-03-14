import type { IMessageRepository } from "../../repositories/IMessageRepository"
import type { Message } from "@/types"

export class GetMessages {
  constructor(private repository: IMessageRepository) {}

  async execute(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    if (!conversationId || conversationId.trim().length === 0) {
      throw new Error("Conversation ID is required")
    }

    if (limit < 1 || limit > 100) {
      throw new Error("Limit must be between 1 and 100")
    }

    if (offset < 0) {
      throw new Error("Offset cannot be negative")
    }

    return this.repository.getByConversation(conversationId, limit, offset)
  }
}
