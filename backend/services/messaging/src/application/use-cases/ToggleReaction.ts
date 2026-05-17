import type { IMessagingRepository } from "../../domain/repositories/IMessagingRepository.js";

export class ToggleReaction {
  constructor(private readonly repository: IMessagingRepository) {}

  async execute(messageId: string, userId: string, emoji: string): Promise<{ reactions: any[] }> {
    const reactions = await this.repository.toggleReaction(messageId, userId, emoji);
    return { reactions };
  }
}
