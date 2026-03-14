import type { Conversation } from "@/types"

/**
 * Interface for Conversation repository.
 * Defines contract for 1:1 conversation data access.
 */
export interface IConversationRepository {
  getById(id: string): Promise<Conversation | null>
  getByUser(userId: string): Promise<Conversation[]>
  getOrCreate(participantA: string, participantB: string): Promise<Conversation>
  updateLastActivity(id: string): Promise<void>
}
