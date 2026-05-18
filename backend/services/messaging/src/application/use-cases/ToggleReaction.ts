import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";
import type { Reaction } from "../../domain/entities/Message.js";

export class ToggleReaction {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(messageId: string, userId: string, emoji: string): Promise<Reaction[]> {
    return this.repository.toggleReaction(messageId, userId, emoji);
  }
}
