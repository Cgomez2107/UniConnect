import type { IStudyGroupMessageRepository } from "../../domain/repositories/IStudyGroupMessageRepository.js";

export class ToggleStudyGroupMessageReaction {
  constructor(private readonly repository: IStudyGroupMessageRepository) {}

  async execute(messageId: string, userId: string, emoji: string): Promise<any[]> {
    return this.repository.toggleReaction(messageId, userId, emoji);
  }
}