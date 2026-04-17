import type { IMessageRepository } from "../../repositories/IMessageRepository"
import type { CreateMessagePayload } from "../../repositories/IMessageRepository"
import type { IConversationRepository } from "../../repositories/IConversationRepository"
import type { Message } from "@/types"

export class SendMessage {
  constructor(private messageRepository: IMessageRepository, private conversationRepository: IConversationRepository) {}

  async execute(
    conversationId: string,
    senderId: string,
    payload: string | CreateMessagePayload
  ): Promise<Message> {
    const normalized = this.normalizePayload(payload)
    this.validate(conversationId, senderId, normalized)

    return this.messageRepository.create(conversationId, senderId, normalized)
  }

  private normalizePayload(payload: string | CreateMessagePayload): CreateMessagePayload {
    if (typeof payload === "string") {
      return { content: payload }
    }

    return payload
  }

  private validate(conversationId: string, senderId: string, payload: CreateMessagePayload): void {
    const content = payload.content?.trim() ?? ""
    const mediaUrl = payload.media_url?.trim() ?? ""

    if (!conversationId || conversationId.trim().length === 0) {
      throw new Error("Conversation ID is required")
    }

    if (!senderId || senderId.trim().length === 0) {
      throw new Error("Sender ID is required")
    }

    if (!content && !mediaUrl) {
      throw new Error("Message content or image is required")
    }

    if (content.length > 5000) {
      throw new Error("Message content must be less than 5000 characters")
    }

    if (mediaUrl.length > 2048) {
      throw new Error("Image URL is too long")
    }
  }
}
