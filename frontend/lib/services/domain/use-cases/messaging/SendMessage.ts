import type { IMessageRepository } from "../../repositories/IMessageRepository"
import type { IConversationRepository } from "../../repositories/IConversationRepository"
import type { Message } from "@/types"

export class SendMessage {
  constructor(private messageRepository: IMessageRepository, private conversationRepository: IConversationRepository) {}

  async execute(conversationId: string, senderId: string, content: string): Promise<Message> {
    this.validate(conversationId, senderId, content)

    return this.messageRepository.create(conversationId, senderId, content)
  }

  private validate(conversationId: string, senderId: string, content: string): void {
    if (!conversationId || conversationId.trim().length === 0) {
      throw new Error("Conversation ID is required")
    }

    if (!senderId || senderId.trim().length === 0) {
      throw new Error("Sender ID is required")
    }

    if (!content || content.trim().length === 0) {
      throw new Error("Message content is required")
    }

    if (content.length > 5000) {
      throw new Error("Message content must be less than 5000 characters")
    }
  }
}
