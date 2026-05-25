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
    mediaUrl?: string;
    mediaType?: string;
    mediaFilename?: string;
    mentions?: any[];
    poll?: {
      question: string;
      options: Array<{
        text: string;
        votes: string[];
      }>;
      isOpen: boolean;
      closesAt: string | null;
      createdAt: string;
    };
  }): Promise<StudyGroupMessage> {
    const created: StudyGroupMessage = {
      id: crypto.randomUUID(),
      requestId: input.requestId,
      senderId: input.actorUserId,
      content: input.content,
      createdAt: new Date().toISOString(),
      senderFullName: null,
      senderAvatarUrl: null,
      mediaUrl: input.mediaUrl ?? null,
      mediaType: input.mediaType ?? null,
      mediaFilename: input.mediaFilename ?? null,
      mentions: input.mentions ?? [],
      reactions: [],
      poll: input.poll ?? null,
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

  async voteInPoll(messageId: string, userId: string, optionIndex: number): Promise<{ requestId: string; poll: any }> {
    const message = this.messages.find((m) => m.id === messageId);
    if (!message) {
      throw new Error("Mensaje no encontrado.");
    }

    if (!message.poll) {
      throw new Error("Este mensaje no contiene una encuesta.");
    }

    if (!message.poll.isOpen) {
      throw new Error("La encuesta ya está cerrada.");
    }

    if (optionIndex < 0 || optionIndex >= message.poll.options.length) {
      throw new Error("Opción inválida.");
    }

    const alreadyVoted = message.poll.options.some((opt) => opt.votes.includes(userId));
    if (alreadyVoted) {
      throw new Error("Ya has votado en esta encuesta.");
    }

    const updatedOptions = message.poll.options.map((opt, i) => {
      if (i === optionIndex) {
        return { ...opt, votes: [...opt.votes, userId] };
      }
      return opt;
    });

    const updatedPoll = {
      ...message.poll,
      options: updatedOptions,
    };

    (message as any).poll = updatedPoll;
    return { requestId: message.requestId, poll: updatedPoll };
  }

  async closePoll(messageId: string): Promise<{ requestId: string; poll: any }> {
    const message = this.messages.find((m) => m.id === messageId);
    if (!message) {
      throw new Error("Mensaje no encontrado.");
    }

    if (!message.poll) {
      throw new Error("Este mensaje no contiene una encuesta.");
    }

    const updatedPoll = { ...message.poll, isOpen: false };
    (message as any).poll = updatedPoll;
    return { requestId: message.requestId, poll: updatedPoll };
  }
}
