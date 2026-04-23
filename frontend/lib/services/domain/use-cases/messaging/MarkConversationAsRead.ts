import type { IMessageRepository } from "../../repositories/IMessageRepository";

export class MarkConversationAsRead {
  constructor(private repository: IMessageRepository) {}

  async execute(conversationId: string): Promise<number> {
    return this.repository.markConversationAsRead(conversationId);
  }
}
