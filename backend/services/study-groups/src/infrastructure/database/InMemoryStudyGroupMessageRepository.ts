import type { StudyGroupMessage } from "../../domain/entities/StudyGroupMessage.js";
import type { IStudyGroupMessageRepository } from "../../domain/repositories/IStudyGroupMessageRepository.js";

export class InMemoryStudyGroupMessageRepository implements IStudyGroupMessageRepository {
  private readonly messages: StudyGroupMessage[] = [];
  private readonly blockedUsers = new Map<string, { until: Date; reason: string }>();
  private readonly messageTimestamps = new Map<string, Date[]>();

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

    const updatedOptions = message.poll.options.map((opt, i) => {
      const cleaned = opt.votes.filter((uid) => uid !== userId);
      if (i === optionIndex) {
        return { ...opt, votes: [...cleaned, userId] };
      }
      return { ...opt, votes: cleaned };
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

  async isUserBlocked(userId: string): Promise<boolean> {
    const block = this.blockedUsers.get(userId);
    if (!block) {
      return false;
    }

    if (new Date() > block.until) {
      this.blockedUsers.delete(userId);
      return false;
    }

    return true;
  }

  async blockUser(userId: string, durationMinutes: number, reason: string): Promise<void> {
    const until = new Date(Date.now() + durationMinutes * 60000);
    this.blockedUsers.set(userId, { until, reason });
    console.warn(`[Moderación] Usuario ${userId} bloqueado por ${durationMinutes} minutos. Razón: ${reason}`);
  }

  async recordMessageTimestamp(userId: string): Promise<number> {
    const now = new Date();
    const limitTime = new Date(now.getTime() - 30000);

    let timestamps = this.messageTimestamps.get(userId) || [];
    timestamps = timestamps.filter((ts) => ts > limitTime);
    timestamps.push(now);

    this.messageTimestamps.set(userId, timestamps);

    return timestamps.length;
  }
}
