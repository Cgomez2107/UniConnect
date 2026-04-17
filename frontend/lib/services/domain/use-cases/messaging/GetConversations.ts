import type { IConversationRepository } from "../../repositories/IConversationRepository"
import type { Conversation } from "@/types"

export class GetConversations {
  constructor(private repository: IConversationRepository) {}

  async execute(userId: string): Promise<Conversation[]> {
    if (!userId || userId.trim().length === 0) {
      throw new Error("User ID is required")
    }

    return this.repository.getByUser(userId)
  }
}
