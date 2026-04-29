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
  }): Promise<StudyGroupMessage>;
}
