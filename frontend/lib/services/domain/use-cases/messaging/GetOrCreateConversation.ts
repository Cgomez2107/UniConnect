import type { Conversation } from "@/types"
import type { IConversationRepository } from "../../repositories/IConversationRepository"

export class GetOrCreateConversation {
  constructor(private repository: IConversationRepository) {}

  async execute(participantA: string, participantB: string): Promise<Conversation> {
    return this.repository.getOrCreate(participantA, participantB)
  }
}
