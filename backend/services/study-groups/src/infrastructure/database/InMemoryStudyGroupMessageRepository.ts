import type { StudyGroupMessage } from "../../domain/entities/StudyGroupMessage.js";
import type { IStudyGroupMessageRepository } from "../../domain/repositories/IStudyGroupMessageRepository.js";

export class InMemoryStudyGroupMessageRepository implements IStudyGroupMessageRepository {
  private readonly messages: StudyGroupMessage[] = [];

  async listByRequest(input: {
    requestId: string;
    actorUserId: string;
    page: number;
    pageSize: number;
  }): Promise<StudyGroupMessage[]> {
    const offset = input.page * input.pageSize;
    return this.messages
      .filter((message) => message.requestId === input.requestId)
      .slice(offset, offset + input.pageSize);
  }

  async create(input: {
    requestId: string;
    actorUserId: string;
    content: string;
  }): Promise<StudyGroupMessage> {
    const created: StudyGroupMessage = {
      id: crypto.randomUUID(),
      requestId: input.requestId,
      senderId: input.actorUserId,
      content: input.content,
      createdAt: new Date().toISOString(),
      senderFullName: null,
      senderAvatarUrl: null,
    };

    this.messages.unshift(created);
    return created;
  }

  async toggleReaction(input: {
    requestId: string;
    messageId: string;
    actorUserId: string;
    emoji: string;
  }): Promise<any[]> {
    const message = this.messages.find(
      (m) => m.id === input.messageId && m.requestId === input.requestId,
    );
    if (!message) throw new Error("Mensaje no encontrado");

    if (!message.reactions) {
      (message as any).reactions = [];
    }

    const reactions = message.reactions as any[];
    const existingIndex = reactions.findIndex(
      (r: any) => r.userId === input.actorUserId && r.emoji === input.emoji,
    );

    if (existingIndex >= 0) {
      reactions.splice(existingIndex, 1);
    } else {
      reactions.push({ userId: input.actorUserId, emoji: input.emoji });
    }

    return reactions;
  }
}
