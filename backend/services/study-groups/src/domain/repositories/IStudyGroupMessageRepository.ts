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
  }): Promise<StudyGroupMessage>;
  toggleReaction(input: {
    requestId: string;
    messageId: string;
    actorUserId: string;
    emoji: string;
  }): Promise<any[]>;
}
