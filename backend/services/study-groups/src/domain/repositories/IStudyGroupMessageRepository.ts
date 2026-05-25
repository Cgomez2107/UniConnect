import type { StudyGroupMessage } from "../entities/StudyGroupMessage.js";

export interface IStudyGroupMessageRepository {
  listByRequest(input: {
    requestId: string;
    actorUserId: string;
    page: number;
    pageSize: number;
  }): Promise<StudyGroupMessage[]>;
  create(input: {
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
  }): Promise<StudyGroupMessage>;
  toggleReaction(messageId: string, currentUserId: string, emoji: string): Promise<any[]>;
  voteInPoll(messageId: string, userId: string, optionIndex: number): Promise<{ requestId: string; poll: any }>;
  closePoll(messageId: string): Promise<{ requestId: string; poll: any }>;
}
