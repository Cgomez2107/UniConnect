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

  async toggleReaction(messageId: string, currentUserId: string, emoji: string): Promise<any[]> {
    const message = this.messages.find((m) => m.id === messageId);
    if (!message) {
      throw new Error("Mensaje no encontrado.");
    }

    const current = message.reactions ?? [];
    const existingIdx = current.findIndex((r: any) => r.emoji === emoji && r.userId === currentUserId);

    let updated: any[];
    if (existingIdx >= 0) {
      updated = current.filter((_: any, i: number) => i !== existingIdx);
    } else {
      updated = [...current, { emoji, userId: currentUserId }];
    }

    (message as any).reactions = updated;
    return updated;
  }
  }
}
