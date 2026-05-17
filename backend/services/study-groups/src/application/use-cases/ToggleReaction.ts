import type { IStudyGroupMessageRepository } from "../../domain/repositories/IStudyGroupMessageRepository.js";

export interface ToggleReactionInput {
  readonly requestId: string;
  readonly messageId: string;
  readonly actorUserId: string;
  readonly emoji: string;
}

export class ToggleReaction {
  constructor(
    private readonly repository: IStudyGroupMessageRepository,
  ) {}

  async execute(input: ToggleReactionInput): Promise<{ reactions: any[] }> {
    if (!input.emoji.trim()) {
      throw new Error("Emoji es requerido");
    }

    const reactions = await this.repository.toggleReaction({
      requestId: input.requestId,
      messageId: input.messageId,
      actorUserId: input.actorUserId,
      emoji: input.emoji,
    });

    return { reactions };
  }
}
